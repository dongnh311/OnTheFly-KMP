package com.onthefly.engine.security

import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.convert
import kotlinx.cinterop.usePinned
import platform.CoreCrypto.CC_SHA256
import platform.CoreCrypto.CC_SHA256_DIGEST_LENGTH

@OptIn(ExperimentalForeignApi::class)
actual fun sha256Hex(input: String): String {
    val data = input.encodeToByteArray()
    val hash = ByteArray(CC_SHA256_DIGEST_LENGTH)
    data.usePinned { pinnedData ->
        hash.usePinned { pinnedHash ->
            CC_SHA256(pinnedData.addressOf(0), data.size.convert(), pinnedHash.addressOf(0))
        }
    }
    return hash.joinToString("") { byte ->
        val hex = (byte.toInt() and 0xFF).toString(16)
        if (hex.length == 1) "0$hex" else hex
    }
}
