package com.onthefly.engine.data

import com.onthefly.engine.model.ScriptBundle
import com.onthefly.engine.data.ScriptRepository

class LoadScriptUseCase(private val repository: ScriptRepository) {
    operator fun invoke(bundleName: String): ScriptBundle {
        return repository.loadBundle(bundleName)
    }
}
