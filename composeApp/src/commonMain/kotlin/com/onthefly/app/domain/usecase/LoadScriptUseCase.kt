package com.onthefly.app.domain.usecase

import com.onthefly.app.domain.model.ScriptBundle
import com.onthefly.app.domain.repository.ScriptRepository

class LoadScriptUseCase(private val repository: ScriptRepository) {
    operator fun invoke(bundleName: String): ScriptBundle {
        return repository.loadBundle(bundleName)
    }
}
