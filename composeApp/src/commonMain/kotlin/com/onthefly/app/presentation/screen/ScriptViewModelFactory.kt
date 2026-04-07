package com.onthefly.app.presentation.screen

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.CreationExtras
import com.onthefly.app.data.source.ScriptStorage
import com.onthefly.app.platform.PlatformActions
import com.onthefly.app.presentation.viewmodel.ScriptViewModel
import kotlin.reflect.KClass

class ScriptViewModelFactory(
    private val localStorage: ScriptStorage,
    private val platformActions: PlatformActions? = null
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: KClass<T>, extras: CreationExtras): T {
        return ScriptViewModel(localStorage, platformActions) as T
    }
}
