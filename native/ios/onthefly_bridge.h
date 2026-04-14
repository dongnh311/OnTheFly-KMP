#ifndef ONTHEFLY_BRIDGE_H
#define ONTHEFLY_BRIDGE_H

#ifdef __cplusplus
extern "C" {
#endif

typedef void* OTFRuntime;
typedef void* OTFContext;

OTFRuntime otf_create_runtime(void);
OTFContext otf_create_context(OTFRuntime runtime);
const char* otf_eval(OTFContext context, const char* script, const char* fileName);
const char* otf_get_ui(OTFContext context);
const char* otf_get_styles(OTFContext context);
const char* otf_get_pending_updates(OTFContext context);
const char* otf_get_pending_actions(OTFContext context);
const char* otf_get_pending_logs(OTFContext context);
void otf_register_module(OTFContext context, const char* name, const char* source);
const char* otf_eval_module(OTFContext context, const char* script, const char* fileName);
void otf_destroy_context(OTFContext context);
void otf_destroy_runtime(OTFRuntime runtime);
void otf_free_string(const char* str);

#ifdef __cplusplus
}
#endif

#endif
