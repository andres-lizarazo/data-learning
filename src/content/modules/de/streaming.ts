import type { Module } from "../../../types/lesson";

// Streaming fundamentals — a starter module. Kafka's model and windowing are
// simulated hands-on in Python (consumer-group offsets, tumbling windows);
// Structured Streaming and the lambda/kappa architectures close the track.
export const streaming: Module = {
  id: "streaming",
  title: "Streaming & Kafka",
  blurb: "Events, Kafka topics & consumer groups, windowing, delivery semantics.",
  track: "Data Engineering",
  level: "Advanced",
  icon: "🌊",
  status: "starter",
  lessons: [
    {
      id: "streaming-fundamentals",
      title: "Streaming Fundamentals",
      summary: "Unbounded data, and the two clocks every stream lives on.",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# Thinking in streams

Batch processes a **bounded** dataset ("June's orders"). A stream is
**unbounded** — events keep coming forever, so every question must be reframed
over **windows** ("orders per 5-minute window").

## The two clocks

Every event has two timestamps, and confusing them causes real bugs:

- **Event time** — when the thing *happened* (in the event's payload).
- **Processing time** — when your system *saw* it.

A phone buys something offline at 09:58; the event uploads at 10:07. Which
5-minute bucket does it belong to? **Event time says 09:55–10:00** — and that's
almost always what the business means. But your system learned about it late,
so the 09:55 window's count was already wrong when it closed…

- **Late events** are therefore normal, not exceptional.
- **Watermarks** are the standard answer: "I'll wait N minutes for stragglers
  before finalizing a window" — a tunable trade between latency and
  completeness.

Everything else in streaming — windowing, delivery guarantees, state — is
machinery for answering batch-shaped questions on never-ending, out-of-order
data.`,
        },
        {
          kind: "quiz",
          question: "A dashboard counts orders per hour by the time events ARRIVE (processing time). The mobile app batches uploads when devices regain signal. What goes wrong?",
          options: [
            {
              text: "Orders made offline get counted in the wrong (later) hour — spikes appear at reconnection times, and per-hour business numbers are simply wrong",
              correct: true,
            },
            { text: "Nothing — arrival time and event time are equivalent at scale" },
            { text: "The dashboard double-counts the batched uploads" },
            { text: "Events are dropped when they arrive late" },
          ],
          explanation:
            "Processing time measures your infrastructure; event time measures the business. Any source with buffering (mobile, IoT, retries) makes the two diverge — event-time windowing plus watermarks is the fix.",
        },
        {
          kind: "quiz",
          question: "A watermark of 10 minutes means…",
          options: [
            {
              text: "windows finalize once the stream's event-time progress passes window-end + 10 minutes — events later than that are 'too late' and handled specially (dropped or side-output)",
              correct: true,
            },
            { text: "events are delayed 10 minutes on purpose" },
            { text: "the pipeline may lag at most 10 minutes" },
            { text: "each window is 10 minutes long" },
          ],
          explanation:
            "The watermark is the completeness bet: wait longer → more accurate but slower results; wait less → faster but more late-event corrections. There is no free lunch — only a dial.",
        },
      ],
    },
    {
      id: "kafka-concepts",
      title: "Kafka Core Concepts",
      summary: "Topics, partitions, offsets, consumer groups — simulate the mechanics.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# Kafka's model

Kafka is a **distributed, append-only log**:

\`\`\`
topic "orders"
  partition 0:  [e0] [e1] [e2] [e3] ...   ← ordered, immutable
  partition 1:  [e0] [e1] ...
  partition 2:  [e0] [e1] [e2] ...
\`\`\`

- **Topic** — a named stream (like a table for events).
- **Partition** — the unit of parallelism & ordering. Events with the same
  **key** (e.g. user_id) hash to the same partition — so per-key order is
  guaranteed, global order is not. (Same hash-partitioning as Spark!)
- **Offset** — each event's position in its partition. Consumers track
  "I've processed up to offset N" — a **high-water mark**, again.
- **Consumer group** — a set of consumers sharing a topic's partitions:
  each partition is read by exactly ONE member, so adding members (up to the
  partition count) scales consumption. Different groups read independently —
  pub/sub (your Observer lesson) with replay.

Two properties that make Kafka the data-platform backbone: events are
**retained** (re-readable — a new consumer can start from offset 0), and
consumers are **decoupled** (the fraud team's group and the warehouse loader's
group never affect each other).`,
        },
        {
          kind: "runnable",
          title: "Simulate consumer groups & offsets",
          code: `# A topic with 3 partitions; same-key events share a partition.
NUM_PARTITIONS = 3
partitions = [[] for _ in range(NUM_PARTITIONS)]

def produce(key, value):
    p = hash(key) % NUM_PARTITIONS
    partitions[p].append(f"{key}:{value}")

for i in range(1, 10):
    produce(f"user-{i % 4}", f"event{i}")

for i, p in enumerate(partitions):
    print(f"partition {i}: {p}")

# A consumer group: each partition owned by exactly one member.
group_offsets = {0: 0, 1: 0, 2: 0}     # committed offset per partition

def poll(partition, max_events=2):
    """One consumer polling its partition: read from the committed offset."""
    start = group_offsets[partition]
    batch = partitions[partition][start : start + max_events]
    group_offsets[partition] = start + len(batch)     # commit AFTER processing
    return batch

print()
print("consumer A (owns p0) polls:", poll(0))
print("consumer A polls again:    ", poll(0))
print("offsets now:", group_offsets)

# A NEW group starts from zero — full replay, independent of group 1:
print()
print("analytics group replays p0 from offset 0:", partitions[0][0:])`,
        },
        {
          kind: "flashcards",
          title: "Kafka vocabulary",
          cards: [
            { front: "Topic", back: "A named, durable stream of events — the 'table' of the streaming world." },
            { front: "Partition", back: "The unit of parallelism AND ordering: an append-only log. Same-key events hash to the same partition, so per-key order is guaranteed (global order is not)." },
            { front: "Offset", back: "An event's position in its partition. Consumers commit 'processed up to offset N' — a high-water mark that makes crash recovery a resume, not a loss." },
            { front: "Consumer group", back: "Consumers sharing a topic: each partition is owned by exactly one member. Different groups read the same topic independently (pub/sub with replay)." },
            { front: "Event time vs processing time", back: "When it HAPPENED (in the payload) vs when your system SAW it. Business questions almost always mean event time; buffering sources make the two diverge." },
            { front: "Watermark", back: "'I'll wait N minutes for late events before finalizing a window.' The dial between result latency and completeness." },
            { front: "At-least-once + idempotent sink =", back: "Effective exactly-once: duplicates from redelivery become no-ops when the write MERGEs/dedupes by event key." },
          ],
        },
        {
          kind: "quiz",
          question: "A topic has 6 partitions and a consumer group with 8 members. What happens?",
          options: [
            {
              text: "6 members get one partition each; 2 sit idle — partitions, not consumers, are the parallelism ceiling",
              correct: true,
            },
            { text: "The 8 members share partitions round-robin per event" },
            { text: "Kafka creates 2 more partitions automatically" },
            { text: "The group fails to start" },
          ],
          explanation:
            "One partition → at most one consumer per group (that's what preserves per-partition order). Choosing partition counts is capacity planning: you can add partitions later, but resizing reshuffles which keys go where.",
        },
        {
          kind: "quiz",
          question: "Why does the warehouse loader crashing for an hour NOT lose events?",
          options: [
            {
              text: "Events are retained in the log; the group's committed offset stayed put, so on restart it resumes exactly where it left off",
              correct: true,
            },
            { text: "Kafka pauses producers while consumers are down" },
            { text: "Another consumer group processes them as backup" },
            { text: "It does lose them — that's why replication exists" },
          ],
          explanation:
            "The log + offsets decouple production from consumption in TIME, not just space. The loader comes back, finds itself behind, and catches up — consumer lag is a metric to monitor, not a data-loss event.",
        },
      ],
    },
    {
      id: "windowing-semantics",
      title: "Windowing & Delivery Semantics",
      summary: "Tumbling windows hands-on, and the at-least/exactly-once ladder.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# Windows

Aggregations over unbounded streams need bounds:

- **Tumbling** — fixed, non-overlapping: \`[0–5) [5–10) [10–15)\`. Each event
  belongs to exactly one window: \`window_start = ts - (ts % size)\`.
- **Sliding/hopping** — overlapping: a 5-min window every 1 min (events belong
  to several).
- **Session** — dynamic: a window per burst of activity, closed by a gap
  (the gap-based sessionization from your SQL Analytics lesson — same idea).

# Delivery semantics

What happens to an event when things crash mid-processing?

| Guarantee | Meaning | Cost |
|---|---|---|
| **at-most-once** | may lose events, never duplicates | cheapest (commit before processing) |
| **at-least-once** | never loses, may duplicate (commit after; crash between = redelivery) | the practical default |
| **exactly-once** | each event's *effect* happens once | transactions/idempotency — the expensive one |

The industry's open secret: most "exactly-once" systems are **at-least-once
delivery + idempotent processing** — dedupe by event key at the sink. You've
owned that pattern since the warehouse module; here it's just wearing a
streaming costume.`,
        },
        {
          kind: "runnable",
          title: "Tumbling windows over an event stream",
          code: `# (event_time_seconds, user) — note the times arrive slightly out of order!
events = [
    (3, "ana"), (7, "bob"), (12, "ana"), (11, "carla"),
    (14, "bob"), (21, "ana"), (18, "dan"), (25, "carla"),
]

WINDOW = 10   # seconds → windows [0,10) [10,20) [20,30)

counts = {}
for ts, user in events:
    window_start = ts - (ts % WINDOW)
    counts[window_start] = counts.get(window_start, 0) + 1

for start in sorted(counts):
    print(f"window [{start:>2}, {start + WINDOW:>2}): {counts[start]} events")

# Out-of-order events were no problem — each carries its event time, and the
# window is computed FROM the event, not from arrival order.`,
        },
        {
          kind: "challenge",
          title: "Implement tumbling window counts",
          prompt: `Write \`tumbling_counts(events, size)\`:

- \`events\` is a list of \`(ts, value)\` tuples (\`ts\` is an integer; order not
  guaranteed).
- Assign each event to the tumbling window starting at \`ts - (ts % size)\`.
- Return a dict mapping **window start → event count**, containing only windows
  with at least one event.`,
          starterCode: `def tumbling_counts(events, size):
    pass`,
          tests: [
            {
              name: "basic windows",
              assertion: `events = [(3, "a"), (7, "b"), (12, "c"), (14, "d"), (21, "e")]
assert tumbling_counts(events, 10) == {0: 2, 10: 2, 20: 1}`,
            },
            {
              name: "out of order is fine",
              assertion: `assert tumbling_counts([(15, "x"), (2, "y"), (11, "z")], 10) == {0: 1, 10: 2}`,
            },
            {
              name: "boundary belongs to the NEW window",
              assertion: `assert tumbling_counts([(10, "edge")], 10) == {10: 1}`,
            },
            {
              name: "empty stream",
              assertion: `assert tumbling_counts([], 5) == {}`,
              hidden: true,
            },
          ],
          hints: [
            "`start = ts - (ts % size)` puts ts=10, size=10 into window 10 (windows are [start, start+size)).",
            "A plain dict with `get(start, 0) + 1` does the counting.",
          ],
          solution: `def tumbling_counts(events, size):
    counts = {}
    for ts, _value in events:
        start = ts - (ts % size)
        counts[start] = counts.get(start, 0) + 1
    return counts`,
          xp: 90,
        },
        {
          kind: "quiz",
          question: "A consumer processes an event, writes to the warehouse, then crashes BEFORE committing its offset. On restart, the event is redelivered. Which semantics is this, and what saves the warehouse?",
          options: [
            {
              text: "At-least-once delivery; an idempotent write (MERGE by event key) makes the duplicate a no-op — 'effective exactly-once'",
              correct: true,
            },
            { text: "Exactly-once — Kafka guarantees it by default" },
            { text: "At-most-once — the event is lost" },
            { text: "The warehouse transactionally rejects reprocessed events on its own" },
          ],
          explanation:
            "Commit-after-processing = at-least-once = duplicates on crash, by design. Sink idempotency turns duplicates into no-ops. Delivery semantics + write patterns are one system — this question is a streaming-interview staple.",
        },
      ],
    },
    {
      id: "structured-streaming-architectures",
      title: "Structured Streaming & Architectures",
      summary: "Spark's streaming model, and lambda vs kappa.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# Spark Structured Streaming

Spark's answer to streaming: **write batch DataFrame code; run it on an
unbounded table.**

\`\`\`python
from pyspark.sql import functions as F

stream = (spark.readStream.format("kafka")
          .option("subscribe", "orders").load())

counts = (stream
    .withWatermark("event_time", "10 minutes")            # the watermark dial!
    .groupBy(F.window("event_time", "5 minutes"), "region")
    .agg(F.sum("amount").alias("revenue")))

(counts.writeStream
    .outputMode("append")
    .option("checkpointLocation", "s3://chk/orders/")     # state + offsets live here
    .toTable("gold.revenue_5min"))
\`\`\`

Everything you know maps over: the query is lazy and optimized; processing is
**micro-batch**; the **checkpoint** holds offsets + window state (kill the job,
restart, it resumes — Auto Loader was this machinery in disguise); watermarks
bound state for late events.

# Lambda vs Kappa

- **Lambda**: two parallel paths — a batch layer (complete, correct, nightly)
  AND a speed layer (approximate, real-time) — merged at query time. Robust but
  you maintain every pipeline **twice**.
- **Kappa**: ONE streaming path; the retained log (Kafka) means "batch" is just
  *replaying the stream* from offset 0. One codebase; needs solid streaming
  infra and replayable sources.

The pragmatic 2020s answer is mostly-kappa on a lakehouse: stream into bronze
Delta tables continuously, run silver/gold as incremental micro-batches, replay
from the log (or bronze) when logic changes. You now hold every concept that
sentence uses — which is exactly where this track was headed.`,
        },
        {
          kind: "quiz",
          question: "Why does Structured Streaming demand a checkpoint location before it will run an aggregation?",
          options: [
            {
              text: "The checkpoint persists consumed offsets AND window state — without it, a restart would lose in-flight windows or reprocess events with no memory of what was counted",
              correct: true,
            },
            { text: "It's where the output table is stored" },
            { text: "Spark licenses are validated through it" },
            { text: "Only for performance — it's an optional cache" },
          ],
          explanation:
            "Stateful streaming = the state IS the computation. Checkpointing makes the job restartable at its exact position — the streaming twin of offset commits + idempotent sinks.",
        },
        {
          kind: "quiz",
          question: "The kappa architecture's core claim is 'you don't need a separate batch layer'. What makes that possible?",
          options: [
            {
              text: "The log retains history, so 'batch' = replaying the stream from the start through the SAME code — one pipeline serves both needs",
              correct: true,
            },
            { text: "Streaming engines became faster than batch engines" },
            { text: "Kappa stores everything in RAM" },
            { text: "Modern data never needs recomputation" },
          ],
          explanation:
            "Replayability collapses the two paths: fixing logic = redeploy + replay from offset 0 (or from bronze). The cost moved from maintaining two codebases to operating one serious streaming platform — a trade that keeps getting better as tooling matures.",
        },
      ],
    },
  ],
};
