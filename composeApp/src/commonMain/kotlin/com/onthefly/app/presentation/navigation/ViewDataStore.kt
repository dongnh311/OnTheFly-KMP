package com.onthefly.app.presentation.navigation

import com.onthefly.app.util.JsonParser

object ViewDataStore {
    private var pendingData: String? = null
    private val routeStack = mutableListOf<String>()

    fun put(data: Map<String, Any>) {
        pendingData = JsonParser.toJsonString(data)
    }

    fun take(): String? {
        val d = pendingData
        pendingData = null
        return d
    }

    fun pushRoute(route: String) { routeStack.add(route) }

    fun popRoute(): String? {
        if (routeStack.size <= 1) return null
        routeStack.removeLastOrNull()
        return routeStack.lastOrNull()
    }

    fun currentRoute(): String? = routeStack.lastOrNull()
}
