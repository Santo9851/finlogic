import os

path = r"c:\Users\poude\Documents\capital website\finlogic\backend\deals\ai_client.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's locate get_model_for_task and _call_deepseek
start_marker = "    def _call_gemini(self, model_name, system_prompt, user_prompt, document=None):"
end_marker = "    def _call_deepseek(self, model_name, system_prompt, user_prompt):"

idx = content.find(start_marker)
end_idx = content.find(end_marker)

if idx != -1 and end_idx != -1:
    prefix = content[:idx]
    suffix = content[end_idx:]
    
    clean_call_gemini = """    def _call_gemini(self, model_name, system_prompt, user_prompt, document=None):
        max_retries = 3
        backoff = 10
        
        for attempt in range(max_retries):
            try:
                start_time = time.time()
                # Use a specific configuration to avoid SDK overhead
                config = types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.1,
                    # Disable AFC to prevent hangs/latency
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(
                        disable=True
                    ) if hasattr(types, 'AutomaticFunctionCallingConfig') else None
                )
                
                contents = [user_prompt]
                if document:
                    # Logic to attach file part
                    try:
                        file_path = document.local_file.path if document.local_file else None
                        if file_path and os.path.exists(file_path):
                            mime = document.mime_type or "application/pdf"
                            # Only attach if it is a supported file type for Gemini (PDF, images)
                            if mime == "application/pdf" or mime.startswith("image/"):
                                with open(file_path, "rb") as f:
                                    file_data = f.read()
                                    contents.append(types.Part.from_bytes(data=file_data, mime_type=mime))
                    except:
                        pass # Fallback to text only

                response = self.client.models.generate_content(
                    model=model_name,
                    config=config,
                    contents=contents
                )
                latency = int((time.time() - start_time) * 1000)
                
                # Metadata
                text = response.text
                prompt_tokens = len(system_prompt + user_prompt) // 4
                completion_tokens = len(text) // 4
                
                # Gemini 3.1 Flash Cost (Estimated)
                cost = (prompt_tokens + completion_tokens) * 0.0000001
                
                return text, prompt_tokens, completion_tokens, latency, cost
            except Exception as e:
                # Log specific error for debugging
                import logging
                logging.getLogger('django').error(f"Gemini Call failed (Attempt {attempt+1}): {str(e)}")
                
                if "429" in str(e) or "ResourceExhausted" in str(e):
                    import logging
                    if "2.5-flash" in model_name:
                        next_model = "gemini-2.0-flash"
                    elif "2.0-flash" in model_name:
                        next_model = "gemini-flash-latest"
                    else:
                        raise e
                    
                    logging.getLogger('django').warning(f"Gemini hit quota/rate restriction on {model_name}. Falling back to {next_model} immediately.")
                    return self._call_gemini(next_model, system_prompt, user_prompt, document=document)
                elif "404" in str(e):
                    if "2.5-flash" in model_name:
                        return self._call_gemini("gemini-2.0-flash", system_prompt, user_prompt, document=document)
                    elif "2.0-flash" in model_name:
                        return self._call_gemini("gemini-flash-latest", system_prompt, user_prompt, document=document)
                    raise e
                else:
                    raise e
"""
    content = prefix + clean_call_gemini + "\n" + suffix
    print("Clean patched success!")
else:
    print("Could not find markers!", idx, end_idx)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Saved cleanly!")
