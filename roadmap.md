# Roadmap
- Implement a cache system to avoid unecessary calls to the DB for conversation history (redis or elasticache)
- Create an abstraction and mapping processor for the receiveSms lambda to become telephony provider agnostic
- Allow for variations and edits for previously generated images from Dall-E
- Replace GPT with a local, trained, LLaMA.cpp instance
- Replace Dall-E with a local, trained, Stable Diffusion instance
- Implement logging framework