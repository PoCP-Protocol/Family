# FPAI Realtime State Machine V1

## States

- IDLE
- LISTENING
- TRANSCRIBING
- THINKING
- SPEAKING
- INTERRUPTED
- HUMAN_GATE
- CLOSED

## Rules

- Transcript events move the session toward LISTENING.
- Interruption moves the session to INTERRUPTED.
- High-risk situations move to HUMAN_GATE.
- The session can resume to LISTENING after interruption or gate handling.
