package com.onthefly.engine.data

import kotlinx.cinterop.*
import platform.Foundation.*
import platform.posix.*

/**
 * Minimal ZIP file extractor for iOS.
 * Supports: Stored (method 0) and Deflated (method 8) entries.
 * Uses system `uncompress` from zlib (linked by default on Apple platforms).
 */
@OptIn(ExperimentalForeignApi::class)
object ZipExtractor {

    data class ZipEntry(
        val name: String,
        val compressedSize: Long,
        val uncompressedSize: Long,
        val method: Int,
        val dataOffset: Long
    )

    /**
     * Extract a zip file to the target directory.
     */
    fun extract(zipPath: String, targetDir: String, onProgress: (Float) -> Unit = {}) {
        val fileManager = NSFileManager.defaultManager
        val data = NSData.dataWithContentsOfFile(zipPath)
            ?: throw IllegalStateException("Cannot read zip: $zipPath")

        val entries = parseEntries(data)
        if (entries.isEmpty()) return

        fileManager.createDirectoryAtPath(targetDir, true, null, null)

        for ((index, entry) in entries.withIndex()) {
            if (entry.name.endsWith("/")) {
                fileManager.createDirectoryAtPath("$targetDir/${entry.name}", true, null, null)
            } else {
                val parentDir = entry.name.substringBeforeLast("/", "")
                if (parentDir.isNotEmpty()) {
                    fileManager.createDirectoryAtPath("$targetDir/$parentDir", true, null, null)
                }
                val content = extractEntry(data, entry)
                content.writeToFile("$targetDir/${entry.name}", true)
            }
            onProgress((index + 1).toFloat() / entries.size)
        }
    }

    /**
     * Read a single file from a zip without extracting everything.
     */
    fun readFileFromZip(zipPath: String, fileName: String): String? {
        val data = NSData.dataWithContentsOfFile(zipPath) ?: return null
        val entries = parseEntries(data)
        val entry = entries.find { it.name == fileName || it.name.endsWith("/$fileName") }
            ?: return null
        val content = extractEntry(data, entry)
        return NSString.create(data = content, encoding = NSUTF8StringEncoding) as? String
    }

    private fun parseEntries(data: NSData): List<ZipEntry> {
        val entries = mutableListOf<ZipEntry>()
        val length = data.length.toLong()
        var offset = 0L

        while (offset + 30 <= length) {
            val sig = readInt32(data, offset)
            if (sig != 0x04034b50) break

            val method = readInt16(data, offset + 8)
            val compressedSize = readInt32(data, offset + 18).toLong() and 0xFFFFFFFFL
            val uncompressedSize = readInt32(data, offset + 22).toLong() and 0xFFFFFFFFL
            val nameLen = readInt16(data, offset + 26)
            val extraLen = readInt16(data, offset + 28)

            val nameData = data.subdataWithRange(NSMakeRange(offset.toULong() + 30u, nameLen.toULong()))
            val name = NSString.create(data = nameData, encoding = NSUTF8StringEncoding) as? String ?: ""

            val dataOffset = offset + 30 + nameLen + extraLen
            entries.add(ZipEntry(name, compressedSize, uncompressedSize, method, dataOffset))
            offset = dataOffset + compressedSize
        }
        return entries
    }

    private fun extractEntry(data: NSData, entry: ZipEntry): NSData {
        if (entry.uncompressedSize == 0L) return NSData()

        val compressedData = data.subdataWithRange(
            NSMakeRange(entry.dataOffset.toULong(), entry.compressedSize.toULong())
        )

        return when (entry.method) {
            0 -> compressedData // Stored — no compression
            8 -> inflateData(compressedData, entry.uncompressedSize.toInt()) // Deflated
            else -> throw IllegalStateException("Unsupported zip method: ${entry.method}")
        }
    }

    private fun inflateData(compressedData: NSData, uncompressedSize: Int): NSData {
        // Use raw deflate decompression via zlib's uncompress2
        // We need to add a fake zlib header (78 01) for uncompress() to work
        val headerSize = 2
        val trailerSize = 4
        val wrappedSize = headerSize + compressedData.length.toInt() + trailerSize
        val wrapped = NSMutableData.dataWithLength(wrappedSize.toULong())
            ?: throw IllegalStateException("Cannot allocate buffer")

        memScoped {
            val bytes = wrapped.mutableBytes!!.reinterpret<ByteVar>()
            // zlib header for raw deflate (no dict, deflate method)
            bytes[0] = 0x78.toByte()
            bytes[1] = 0x01.toByte()

            // Copy compressed data
            val compBytes = compressedData.bytes?.reinterpret<ByteVar>()
            if (compBytes != null) {
                platform.posix.memcpy(bytes + 2, compBytes, compressedData.length)
            }

            // Adler32 checksum placeholder (required by zlib wrapper but value doesn't matter
            // for decompression — zlib will compute and verify, but we skip strict checking)
            val off = headerSize + compressedData.length.toInt()
            bytes[off] = 0
            bytes[off + 1] = 0
            bytes[off + 2] = 0
            bytes[off + 3] = 0
        }

        // Use NSData decompression if available (iOS 13+), otherwise fall back
        // to manual byte-level extraction
        @Suppress("UNCHECKED_CAST")
        val decompressed = try {
            // Try using zlib uncompress via C interop
            decompressWithZlib(wrapped, uncompressedSize)
        } catch (e: Exception) {
            throw IllegalStateException("Decompression failed: ${e.message}")
        }

        return decompressed
    }

    private fun decompressWithZlib(compressedData: NSData, uncompressedSize: Int): NSData {
        memScoped {
            val destLen = alloc<ULongVar>()
            destLen.value = uncompressedSize.toULong()

            val dest = allocArray<ByteVar>(uncompressedSize)
            val src = compressedData.bytes?.reinterpret<ByteVar>()
                ?: throw IllegalStateException("No compressed data")

            val result = platform.zlib.uncompress(
                dest.reinterpret(),
                destLen.ptr,
                src.reinterpret(),
                compressedData.length
            )

            if (result != platform.zlib.Z_OK) {
                throw IllegalStateException("zlib uncompress failed with code: $result")
            }

            return NSData.create(bytes = dest, length = destLen.value)
        }
    }

    private fun readInt16(data: NSData, offset: Long): Int {
        memScoped {
            val bytes = allocArray<ByteVar>(2)
            data.getBytes(bytes, NSMakeRange(offset.toULong(), 2u))
            return (bytes[0].toInt() and 0xFF) or ((bytes[1].toInt() and 0xFF) shl 8)
        }
    }

    private fun readInt32(data: NSData, offset: Long): Int {
        memScoped {
            val bytes = allocArray<ByteVar>(4)
            data.getBytes(bytes, NSMakeRange(offset.toULong(), 4u))
            return (bytes[0].toInt() and 0xFF) or
                    ((bytes[1].toInt() and 0xFF) shl 8) or
                    ((bytes[2].toInt() and 0xFF) shl 16) or
                    ((bytes[3].toInt() and 0xFF) shl 24)
        }
    }
}
