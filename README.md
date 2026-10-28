# The Ofrenda Witness

**A ten-minute murder mystery in which the ghost of the victim speaks at his own ofrenda. An open-weight model runs entirely in your browser, and it is only allowed to say what the dead man actually remembers.**

Tomás Ibarra, a retired clockmaker, died at the bottom of his workshop stairs. On the first night of November his granddaughter builds an ofrenda. Place one of his keepsakes on it — his pocket watch, his radio, his reading glasses, his key — and Tomás remembers what that object saw. He never saw who pushed him. You have to work it out.

## Run

```
python -m http.server 8765
```

Open `http://localhost:8765/` in a recent Chrome or Edge (WebGPU), pick a model, and press **Load the ghost**. The first load downloads the model weights into the browser cache (about 0.8 GB for the default); after that the game works offline.

`npm test` runs the verifier tests (Node 20+).

## How the ghost is kept honest

A small model that invents a clue ruins a mystery: the player reasons from a fact that does not exist. So the ghost is boxed in three ways.

1. **It only knows what is on the altar.** The system prompt holds just the memories tied to the keepsakes you have placed. The culprit's name is not in the case file at all; the accusation is checked against a SHA-256 hash.
2. **Every reply is checked before you see it** (`verify.js`). A reply is rejected if it contains a time, a capitalised name, or a clue object (knife, glove, phone, …) that is not in the memories given, if it says anyone did or did not do it, or if it runs past three sentences. The model is asked to answer again, up to two times. If it still invents, the ghost quotes the closest memory word for word instead.
3. **Questions about who did it never reach the model.** In testing, Qwen2.5-1.5B answered "Was it Dario? Yes or no" with "No." — a false clue that passed every word check. Now any question about the culprit gets a fixed answer: *I never saw who stood behind me.*

Replies carry a small note saying whether they were checked, retold, or quoted.

## Models

Runs on [WebLLM](https://github.com/mlc-ai/web-llm) 0.2.86 with WebGPU. The model version and seed are pinned, so the same question gets the same answer (3 of 3 identical in testing on one machine; other GPUs may differ slightly).

| Model | Weights | License |
|---|---|---|
| Qwen2.5-1.5B-Instruct (default) | ~0.8 GB | Apache-2.0 |
| Llama-3.2-1B-Instruct | ~0.9 GB | Llama 3.2 Community License |
| Qwen2.5-0.5B-Instruct (low-end devices) | ~0.4 GB | Apache-2.0 |

On a laptop with AMD integrated graphics (RDNA2), the default model loads in about 24 seconds on first visit and answers in about 6 seconds.

## Files

- `case.js` — the case: intro, people, keepsakes, memories, allowed names and times, the solution hash
- `verify.js` — the reply checker and the culprit-question filter
- `app.js` — loads the model, builds the prompt, retells or quotes when a reply fails
- `index.html` — the page

To write your own case, copy `case.js`: keep every time and name the ghost may say in `allowedNames` / `allowedTimes`, and set `solutionHash` to `sha256("ofrenda:" + full name)`.

## How it was built

Built with Claude (Anthropic's Claude Code) from a written concept, and play-tested in the browser with the real model before release.

## License

MIT
