package com.onthefly.engine.model

data class UIUpdate(
    val id: String,
    val props: Map<String, Any>
)

fun UIComponent.applyUpdates(updates: List<UIUpdate>): UIComponent {
    val myId = props["id"] as? String

    var newProps = props
    for (update in updates) {
        if (myId != null && myId == update.id) {
            newProps = newProps + update.props
        }
    }

    val newChildren = children.map { it.applyUpdates(updates) }

    return if (newProps !== props || newChildren !== children) {
        copy(props = newProps, children = newChildren)
    } else {
        this
    }
}
