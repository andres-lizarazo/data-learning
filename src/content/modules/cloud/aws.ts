import type { Module } from "../../../types/lesson";

// AWS for data — the cloud services a data engineer actually touches, framed as the
// managed versions of everything you already learned: S3 = the data lake, Redshift =
// the warehouse, Glue = ETL + catalog, Athena = SQL on files, Kinesis = streaming,
// Step Functions/MWAA = orchestration. Runnable sims make the mechanics concrete:
// IAM allow/deny evaluation, S3 prefix (partition) pruning, and Athena scan cost.
export const aws: Module = {
  id: "aws",
  title: "AWS for Data",
  blurb: "IAM, S3 data lakes, compute, databases, and the AWS data stack.",
  track: "Cloud",
  level: "Intermediate",
  icon: "☁️",
  status: "deep",
  lessons: [
    {
      id: "aws-mental-model",
      title: "The AWS Mental Model",
      summary: "Regions & AZs, shared responsibility, and how you interact with AWS.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# What 'the cloud' actually is

AWS (Amazon Web Services) rents you computers, storage, and managed services **on
demand, by the second**. Instead of buying servers, you provision what you need,
pay for what you use, and turn it off when you're done. For data teams that means:
spin up a 50-node Spark cluster for an hour, then delete it.

# Regions and Availability Zones

AWS is physical infrastructure, organized geographically:

- **Region** — a geographic area (\`us-east-1\`, \`eu-west-1\`). You choose one for
  **latency** (close to users/data), **compliance** (data residency laws), and
  **cost** (prices vary by region). Most services are region-scoped: an S3 bucket
  lives in a region.
- **Availability Zone (AZ)** — one or more isolated data centers within a region
  (\`us-east-1a\`, \`us-east-1b\`). Spreading across AZs gives you **high availability**:
  if one data center loses power, your workload survives in another.

> Rule of thumb: pick a region and **keep your data and compute in the same one** —
> cross-region data transfer is slow and costs money. A Spark job in \`us-east-1\`
> reading an S3 bucket in \`eu-west-1\` is a classic accidental cost + latency bomb.

# The shared responsibility model

Security is split:

- **AWS secures the cloud** — physical data centers, hardware, the hypervisor, the
  managed-service internals. ("Security *of* the cloud.")
- **You secure what's in it** — your IAM permissions, which buckets are public, your
  encryption, your data. ("Security *in* the cloud.")

Nearly every AWS data breach in the news is the customer's side: a public S3 bucket,
an over-permissioned key. AWS gave you the locks; leaving the door open is on you.

# How you actually interact with AWS

- **Console** — the web UI. Great for learning and one-off inspection; terrible for
  anything repeatable (not versioned, not reproducible).
- **CLI** — \`aws s3 ls s3://my-bucket/\`. Scriptable; the shell skills from the Linux
  track apply directly.
- **SDK** — libraries like Python's **boto3** (\`import boto3\`) to call AWS from code
  — how your pipelines talk to S3, Glue, etc.
- **IaC** (Infrastructure as Code) — Terraform / CloudFormation / CDK describe your
  infrastructure in version-controlled files. This is the professional default:
  reproducible, reviewable in a PR, and diffable — the same Git discipline you just
  learned, applied to infrastructure.`,
        },
        {
          kind: "quiz",
          question: "Under the AWS shared responsibility model, who is responsible for making sure an S3 bucket holding customer data isn't publicly readable?",
          options: [
            {
              text: "You (the customer) — AWS secures the infrastructure, but access controls, bucket policies, and encryption of your data are 'security IN the cloud', your responsibility",
              correct: true,
            },
            { text: "AWS — they secure everything by default" },
            { text: "It's automatically private and can never be made public" },
            { text: "Whoever created the AWS account's payment method" },
          ],
          explanation:
            "AWS secures the data centers and service internals ('of the cloud'); configuration — IAM, bucket policies, public-access settings, encryption — is yours ('in the cloud'). Most headline S3 leaks are misconfigured customer buckets, not AWS failures.",
        },
        {
          kind: "quiz",
          question: "Why do experienced teams manage AWS infrastructure with Terraform/CloudFormation instead of clicking in the Console?",
          options: [
            {
              text: "IaC is version-controlled, reviewable in a PR, reproducible, and diffable — clicking in the Console is manual, unversioned, and impossible to reliably reproduce",
              correct: true,
            },
            { text: "The Console can only create one resource per day" },
            { text: "IaC is free while the Console costs extra" },
            { text: "Terraform runs your workloads faster" },
          ],
          explanation:
            "Infrastructure as Code brings the Git workflow to infrastructure: changes are reviewed, history is auditable, and an environment can be rebuilt identically. Console clicks leave no record and drift over time — fine for learning, not for production.",
        },
        {
          kind: "flashcards",
          title: "AWS foundations",
          cards: [
            { front: "Region", back: "A geographic area (us-east-1). Chosen for latency, compliance/data-residency, and cost. Most services are region-scoped." },
            { front: "Availability Zone (AZ)", back: "Isolated data center(s) within a region. Spreading across AZs gives high availability if one fails." },
            { front: "Keep data + compute co-located", back: "Same region (ideally same AZ) — cross-region transfer is slow and billed. A common accidental cost/latency bug." },
            { front: "Shared responsibility model", back: "AWS secures OF the cloud (hardware, hypervisor, service internals); you secure IN the cloud (IAM, access, encryption, your data)." },
            { front: "Console / CLI / SDK / IaC", back: "Web UI / scriptable command line / boto3 & other libraries / version-controlled infra (Terraform, CloudFormation, CDK)." },
            { front: "boto3", back: "The AWS SDK for Python — how pipelines call S3, Glue, etc. from code." },
          ],
        },
      ],
    },
    {
      id: "aws-iam",
      title: "IAM: Identity & Access",
      summary: "Users, roles, policies, least privilege — and how a request is evaluated.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# IAM controls who can do what

**IAM** (Identity and Access Management) is the permission system in front of *every*
AWS API call. Get it right and it's invisible; get it wrong and you either can't
access your data or you've exposed it to the world.

## The building blocks

- **User** — a long-lived identity for a person (or legacy app), with credentials.
- **Role** — an identity a *service or session* **assumes temporarily**, getting
  short-lived credentials. This is the preferred pattern: your Lambda/EC2/Glue job
  **assumes a role** instead of carrying a static key. No long-lived secrets to leak.
- **Policy** — a JSON document that grants or denies permissions. You attach policies
  to users/roles.
- **Group** — a bucket of users that share policies (the "data-engineers" group).

## A policy document

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::data-lake",
        "arn:aws:s3:::data-lake/raw/*"
      ]
    }
  ]
}
\`\`\`

Every statement has an **Effect** (Allow/Deny), one or more **Action**s (the API
calls, like \`s3:GetObject\`), and the **Resource**(s) they apply to (identified by
**ARN** — Amazon Resource Name).

## How a request is decided

1. **Default deny** — if nothing explicitly allows it, it's denied.
2. An **explicit Allow** that matches the action + resource permits it.
3. An **explicit Deny** always wins — it overrides any Allow.

So: **deny by default, allow what's needed, and an explicit deny trumps everything.**

## Least privilege

Grant the **minimum** permissions a principal needs — this job reads
\`s3://lake/raw/*\`, nothing more. Never attach \`AdministratorAccess\` to a pipeline
"to make it work." When a key leaks (and keys leak), least privilege is the
difference between "read one prefix" and "owns the whole account." It's the cloud
version of \`chmod 600\`: give exactly the access required, no more.`,
        },
        {
          kind: "runnable",
          title: "Evaluate an IAM request (default-deny, explicit-deny-wins)",
          code: `import fnmatch

policy = [
    {"Effect": "Allow", "Action": ["s3:GetObject", "s3:ListBucket"],
     "Resource": ["arn:aws:s3:::lake", "arn:aws:s3:::lake/raw/*"]},
    {"Effect": "Allow", "Action": ["s3:PutObject"],
     "Resource": ["arn:aws:s3:::lake/staging/*"]},
    {"Effect": "Deny",  "Action": ["s3:*"],
     "Resource": ["arn:aws:s3:::lake/secrets/*"]},   # hard boundary
]

def evaluate(policy, action, resource):
    allowed = False
    for stmt in policy:
        act_ok = any(fnmatch.fnmatch(action, a) for a in stmt["Action"])
        res_ok = any(fnmatch.fnmatch(resource, r) for r in stmt["Resource"])
        if act_ok and res_ok:
            if stmt["Effect"] == "Deny":
                return "DENY (explicit deny wins)"   # short-circuit
            allowed = True
    return "ALLOW" if allowed else "DENY (default: no matching Allow)"

tests = [
    ("s3:GetObject", "arn:aws:s3:::lake/raw/orders.csv"),   # allowed
    ("s3:PutObject", "arn:aws:s3:::lake/staging/tmp.csv"),  # allowed
    ("s3:PutObject", "arn:aws:s3:::lake/raw/orders.csv"),   # no Allow -> deny
    ("s3:GetObject", "arn:aws:s3:::lake/secrets/keys.txt"), # explicit Deny
    ("s3:DeleteBucket", "arn:aws:s3:::lake"),               # no Allow -> deny
]
for action, resource in tests:
    print(f"{action:<16} {resource:<40} -> {evaluate(policy, action, resource)}")`,
        },
        {
          kind: "challenge",
          title: "Implement IAM policy evaluation",
          prompt: `Write \`policy_allows(statements, action, resource)\` implementing AWS's core
evaluation logic. Each statement is a dict with \`"Effect"\` (\`"Allow"\` or \`"Deny"\`),
\`"Action"\` (a list), and \`"Resource"\` (a list). Action and resource strings may use
\`*\` as a wildcard (e.g. \`"s3:*"\`, \`"arn:...:lake/raw/*"\`).

Rules, in priority order:

1. If **any matching statement** has \`Effect == "Deny"\`, the result is \`False\`
   (explicit deny always wins).
2. Otherwise, if **any statement** matches with \`Effect == "Allow"\`, return \`True\`.
3. Otherwise return \`False\` (default deny).

A statement "matches" when the requested action matches one of its \`Action\` patterns
**and** the requested resource matches one of its \`Resource\` patterns (use \`*\` glob
matching — \`fnmatch\` is available).`,
          starterCode: `def policy_allows(statements, action, resource):
    pass`,
          tests: [
            {
              name: "explicit allow",
              assertion: `p = [{"Effect": "Allow", "Action": ["s3:GetObject"], "Resource": ["arn:s3:::lake/*"]}]
assert policy_allows(p, "s3:GetObject", "arn:s3:::lake/raw/x.csv") is True`,
            },
            {
              name: "default deny (no match)",
              assertion: `p = [{"Effect": "Allow", "Action": ["s3:GetObject"], "Resource": ["arn:s3:::lake/*"]}]
assert policy_allows(p, "s3:PutObject", "arn:s3:::lake/raw/x.csv") is False`,
            },
            {
              name: "wildcard action",
              assertion: `p = [{"Effect": "Allow", "Action": ["s3:*"], "Resource": ["arn:s3:::lake/*"]}]
assert policy_allows(p, "s3:DeleteObject", "arn:s3:::lake/a") is True`,
            },
            {
              name: "explicit deny overrides allow",
              assertion: `p = [
    {"Effect": "Allow", "Action": ["s3:*"], "Resource": ["arn:s3:::lake/*"]},
    {"Effect": "Deny",  "Action": ["s3:*"], "Resource": ["arn:s3:::lake/secrets/*"]},
]
assert policy_allows(p, "s3:GetObject", "arn:s3:::lake/secrets/k") is False
assert policy_allows(p, "s3:GetObject", "arn:s3:::lake/raw/k") is True`,
            },
            {
              name: "empty policy is deny",
              assertion: `assert policy_allows([], "s3:GetObject", "arn:s3:::lake/x") is False`,
              hidden: true,
            },
          ],
          hints: [
            "Use `fnmatch.fnmatch` for both action and resource wildcard matching.",
            "Scan all statements: collect whether any matching Deny exists and whether any matching Allow exists.",
            "Return False if a matching Deny exists; else return whether a matching Allow exists.",
          ],
          solution: `import fnmatch

def policy_allows(statements, action, resource):
    def matches(stmt):
        act_ok = any(fnmatch.fnmatch(action, a) for a in stmt["Action"])
        res_ok = any(fnmatch.fnmatch(resource, r) for r in stmt["Resource"])
        return act_ok and res_ok

    allowed = False
    for stmt in statements:
        if matches(stmt):
            if stmt["Effect"] == "Deny":
                return False
            allowed = True
    return allowed`,
          xp: 110,
        },
        {
          kind: "quiz",
          question: "Why is having a Glue/EC2 job ASSUME A ROLE preferred over giving it a long-lived access key?",
          options: [
            {
              text: "A role provides short-lived, auto-rotated credentials with no static secret to leak or hardcode; a long-lived key is a permanent liability if exposed",
              correct: true,
            },
            { text: "Roles are free while access keys cost money" },
            { text: "Roles grant AdministratorAccess automatically" },
            { text: "Access keys don't work with S3" },
          ],
          explanation:
            "Roles issue temporary credentials that expire and rotate automatically, so there's no static secret sitting in a config file or env var to be committed or stolen. This — plus least privilege — is the backbone of AWS security hygiene.",
        },
        {
          kind: "flashcards",
          title: "IAM vocabulary",
          cards: [
            { front: "IAM", back: "Identity and Access Management — the permission system in front of every AWS API call. Deny by default." },
            { front: "User vs Role", back: "User = long-lived identity for a person. Role = identity a service/session ASSUMES temporarily for short-lived credentials (preferred — no static secret)." },
            { front: "Policy", back: "A JSON document of statements (Effect + Action + Resource) that grants/denies permissions. Attached to users/roles/groups." },
            { front: "ARN", back: "Amazon Resource Name — the unique id of a resource, e.g. arn:aws:s3:::data-lake/raw/*. Used in a policy's Resource." },
            { front: "Evaluation order", back: "1) default deny; 2) an explicit Allow permits; 3) an explicit Deny always wins over any Allow." },
            { front: "Least privilege", back: "Grant only the minimum actions/resources a principal needs. The cloud version of chmod 600 — limits blast radius when a credential leaks." },
          ],
        },
      ],
    },
    {
      id: "aws-s3-data-lake",
      title: "S3: the Data Lake Foundation",
      summary: "Objects, keys as prefixes, partition layout, storage classes.",
      minutes: 15,
      blocks: [
        {
          kind: "prose",
          markdown: `# S3 is where data lives

**S3** (Simple Storage Service) is AWS's object store and the foundation of nearly
every data platform on AWS. It's cheap, effectively infinite, and durable
(11 nines — 99.999999999%). Your **data lake** *is* an S3 bucket.

- **Bucket** — a globally-named container (\`s3://acme-data-lake\`), living in a region.
- **Object** — a file plus metadata. Objects are **immutable**: you replace, not edit.
- **Key** — the object's full name within the bucket. It *looks* like a path, but S3
  is a **flat key–value store**: there are no real folders. \`raw/orders/2026/01/x.parquet\`
  is just a key string.

# Prefixes are your "folders" — and they power partition pruning

Because tools list objects by **key prefix**, engineers encode structure into keys —
especially **partitioning** by date:

\`\`\`
s3://lake/orders/year=2026/month=01/day=05/part-000.parquet
s3://lake/orders/year=2026/month=01/day=06/part-000.parquet
s3://lake/orders/year=2026/month=02/day=01/part-000.parquet
\`\`\`

A query for "February 2026" only needs to list/read objects under the prefix
\`orders/year=2026/month=02/\` — it **skips** every other file without reading it. This
is **partition pruning**, and on S3 it's literally a prefix filter. Same partitioning
idea you met in the warehouse/lakehouse track — here's where it physically lives. The
\`key=value\` naming (**Hive-style partitioning**) is what lets Athena/Spark/Glue infer
partitions automatically.

# Storage classes: pay for the access pattern

Not all data is accessed equally, so S3 tiers it by cost:

| Class | For | Trade-off |
|---|---|---|
| **S3 Standard** | hot, frequently read | most expensive storage, cheap access |
| **Standard-IA** | infrequent access | cheaper storage, per-retrieval fee |
| **Glacier / Deep Archive** | archives, compliance | cheapest storage, retrieval takes minutes–hours |

**Lifecycle policies** move objects between tiers automatically ("after 90 days →
Standard-IA, after 1 year → Glacier"), which is how a lake keeps years of history
affordable. Enable **versioning** to keep object history (undo an overwrite/delete),
and **encryption** (usually on by default) to protect data at rest.`,
        },
        {
          kind: "runnable",
          title: "Partition pruning is a prefix filter",
          code: `keys = [
    "orders/year=2026/month=01/day=05/part-000.parquet",
    "orders/year=2026/month=01/day=06/part-000.parquet",
    "orders/year=2026/month=02/day=01/part-000.parquet",
    "orders/year=2026/month=02/day=02/part-000.parquet",
    "orders/year=2025/month=12/day=31/part-000.parquet",
]

def list_prefix(keys, prefix):
    """S3 ListObjects(prefix=...) — the engine only 'sees' matching keys."""
    return [k for k in keys if k.startswith(prefix)]

# Query: WHERE year=2026 AND month=02  -> read ONE prefix, skip the rest
pruned = list_prefix(keys, "orders/year=2026/month=02/")
print("Scanning for Feb 2026:")
for k in pruned:
    print("  READ ", k)

skipped = [k for k in keys if k not in pruned]
print(f"\\nPruned (never opened): {len(skipped)} of {len(keys)} files")
for k in skipped:
    print("  skip ", k)

# Without a date partition in the key, you'd have to read ALL files to find Feb.
# That's why the physical layout (the key design) IS a performance decision.`,
        },
        {
          kind: "challenge",
          title: "Filter S3 keys by partition",
          prompt: `Hive-style partitioned keys look like
\`orders/year=2026/month=02/day=05/part-000.parquet\`. Write
\`select_partitions(keys, filters)\` that returns the keys matching **all** the given
partition filters.

- \`filters\` is a dict like \`{"year": "2026", "month": "02"}\`.
- A key matches a filter \`col=val\` if it contains the segment \`col=val\` between
  slashes (i.e. \`/year=2026/\` appears, or the key starts with \`year=2026/\`).
- Return keys matching **every** filter, preserving input order.
- An empty \`filters\` dict matches all keys.`,
          starterCode: `def select_partitions(keys, filters):
    pass`,
          tests: [
            {
              name: "single filter",
              assertion: `keys = ["o/year=2026/month=01/x", "o/year=2025/month=01/y"]
assert select_partitions(keys, {"year": "2026"}) == ["o/year=2026/month=01/x"]`,
            },
            {
              name: "multiple filters (AND)",
              assertion: `keys = [
    "o/year=2026/month=01/a", "o/year=2026/month=02/b", "o/year=2025/month=02/c",
]
assert select_partitions(keys, {"year": "2026", "month": "02"}) == ["o/year=2026/month=02/b"]`,
            },
            {
              name: "no filters matches all",
              assertion: `keys = ["a", "b"]
assert select_partitions(keys, {}) == ["a", "b"]`,
            },
            {
              name: "no partial-value match (2026 != 20261)",
              assertion: `keys = ["o/year=2026/m", "o/year=20261/m"]
assert select_partitions(keys, {"year": "2026"}) == ["o/year=2026/m"]`,
              hidden: true,
            },
          ],
          hints: [
            "For each filter build the exact segment string `f\"{col}={val}\"` and require `/{segment}/` to appear.",
            "To also match a segment at the very start of the key, prepend a '/' to the key before searching: `('/' + key)`.",
            "Keep a key only if ALL filters match — `all(...)` over the filter items.",
          ],
          solution: `def select_partitions(keys, filters):
    def matches(key):
        padded = "/" + key + "/"
        return all(f"/{col}={val}/" in padded for col, val in filters.items())
    return [k for k in keys if matches(k)]`,
          xp: 110,
        },
        {
          kind: "quiz",
          question: "S3 is described as a 'flat key–value store', yet everyone talks about folders. What's actually going on with `raw/orders/2026/file.parquet`?",
          options: [
            {
              text: "There are no real directories — the whole string is the object's key. Tools simulate folders by grouping on the '/' prefix, which is exactly what makes prefix-based partition pruning work",
              correct: true,
            },
            { text: "S3 creates real nested folders on disk like a normal filesystem" },
            { text: "Each slash creates a separate bucket" },
            { text: "The path is ignored; only the filename matters" },
          ],
          explanation:
            "S3 maps a key string to an object; slashes are just characters. Listing by prefix gives the folder illusion — and because a date-partitioned layout puts each day under its own prefix, a query can list only the relevant prefix and skip the rest.",
        },
        {
          kind: "quiz",
          question: "You keep 5 years of raw logs in S3 but only query the last 30 days. How do you cut storage cost without deleting history?",
          options: [
            {
              text: "A lifecycle policy that transitions older objects to Standard-IA, then Glacier/Deep Archive — cheap long-term storage, with slower retrieval you rarely need",
              correct: true,
            },
            { text: "Store everything in S3 Standard; it's already the cheapest" },
            { text: "Delete anything older than 30 days" },
            { text: "Move the old data into an EC2 instance's local disk" },
          ],
          explanation:
            "Lifecycle rules tier data by age automatically: hot data stays in Standard, cold history drops to IA then Glacier for a fraction of the price. You keep full history for compliance/backfills and pay archive rates for data you seldom touch.",
        },
      ],
    },
    {
      id: "aws-compute",
      title: "Compute: EC2, Lambda & Containers",
      summary: "Servers vs serverless vs containers — and when to use each for data.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Three ways to run code

## EC2 — virtual servers

**EC2** (Elastic Compute Cloud) rents you virtual machines by the second. You pick an
**instance type** (CPU/RAM/GPU balance), and you manage the OS, patches, and scaling.
Maximum control, maximum responsibility. For data: long-running services, a database
you self-manage, or the nodes under a Spark/EMR cluster.

- **On-demand** — pay per second, no commitment. Flexible, priciest.
- **Spot** — spare capacity at up to ~90% off, but AWS can reclaim it with 2 minutes'
  notice. Perfect for **fault-tolerant batch** (Spark tasks that can be retried) — a
  huge cost lever for data workloads.
- **Reserved / Savings Plans** — commit 1–3 years for a discount on steady baseline
  load.

## Lambda — serverless functions

**Lambda** runs a function **on an event**, with **no servers to manage**. You upload
code; AWS runs it when triggered, scales to thousands of concurrent invocations, and
you pay only per invocation + runtime (nothing when idle).

For data, Lambda shines as **glue**: "a new file landed in S3 → trigger a Lambda to
validate it / kick off a job", stream processing from Kinesis, lightweight API
backends. Limits keep it honest: max 15-minute runtime and limited memory, so it's for
short tasks, not a 3-hour Spark job.

## Containers — ECS, Fargate, EKS

Package your code + dependencies into a **container** (Docker) and run it consistently
anywhere. On AWS:

- **ECS/EKS** — orchestrators (EKS = managed Kubernetes) that schedule containers,
  usually on EC2 you manage.
- **Fargate** — **serverless containers**: run a container without managing servers,
  like Lambda but without the 15-minute limit — great for containerized batch jobs and
  longer transforms.

# Choosing

| Need | Reach for |
|---|---|
| Full control / long-running / self-managed cluster | **EC2** |
| Short, event-driven glue, scale-to-zero | **Lambda** |
| Cheap fault-tolerant batch | **EC2 Spot** (e.g. under EMR) |
| Containerized job, no server management | **Fargate** |
| Managed Kubernetes at scale | **EKS** |

The trend is toward **serverless** (Lambda, Fargate, and the serverless data services
next lesson): less ops, pay-per-use, scale-to-zero — you focus on the data, not the
servers.`,
        },
        {
          kind: "quiz",
          question: "A new file lands in an S3 bucket and you want to automatically validate it and trigger a downstream job — a short task that may fire hundreds of times a day. Best fit?",
          options: [
            {
              text: "Lambda — event-driven, scales automatically per invocation, no idle cost, and short tasks fit well within its runtime limits",
              correct: true,
            },
            { text: "A permanently-running EC2 instance polling the bucket every second" },
            { text: "An EKS Kubernetes cluster" },
            { text: "S3 Glacier" },
          ],
          explanation:
            "S3 events → Lambda is the canonical serverless glue pattern: it runs only when a file arrives, scales with the event rate, and costs nothing while idle. A long-lived EC2 poller wastes money and adds ops; the task is far too small for a Kubernetes cluster.",
        },
        {
          kind: "quiz",
          question: "Why is EC2 Spot a great fit for Spark batch jobs but a bad fit for a stateful primary database?",
          options: [
            {
              text: "Spot instances can be reclaimed with ~2 minutes' notice; Spark retries lost tasks so it tolerates that, but a primary database losing its node abruptly risks downtime/data loss",
              correct: true,
            },
            { text: "Spot instances can't run databases at all for licensing reasons" },
            { text: "Spark is not allowed on on-demand instances" },
            { text: "Databases run faster on Spot than on-demand" },
          ],
          explanation:
            "Spot trades price for interruptibility. Fault-tolerant, retryable workloads (distributed batch) absorb reclaims for up to ~90% savings; a stateful, always-on service wants the reliability of on-demand/reserved capacity. Matching the pricing model to fault-tolerance is a core cost skill.",
        },
        {
          kind: "flashcards",
          title: "AWS compute",
          cards: [
            { front: "EC2", back: "Virtual servers by the second. Max control, you manage the OS/scaling. For long-running services, self-managed clusters, custom setups." },
            { front: "Spot vs On-demand vs Reserved", back: "Spot = up to ~90% off but reclaimable (great for fault-tolerant batch). On-demand = flexible, priciest. Reserved/Savings Plans = discount for a 1–3yr commit on steady load." },
            { front: "Lambda", back: "Serverless functions triggered by events. Auto-scales, pay per invocation, nothing when idle. Max 15-min runtime — for short glue tasks, not big jobs." },
            { front: "Fargate", back: "Serverless containers — run a Docker container with no servers to manage and no 15-min limit. Good for containerized batch/longer transforms." },
            { front: "ECS / EKS", back: "Container orchestrators. EKS = managed Kubernetes; ECS = AWS's own scheduler. Run containers on EC2 (or Fargate)." },
            { front: "Serverless trend", back: "Lambda/Fargate + serverless data services: less ops, pay-per-use, scale-to-zero. Focus on data, not managing servers." },
          ],
        },
      ],
    },
    {
      id: "aws-databases",
      title: "Databases on AWS",
      summary: "RDS, DynamoDB, Redshift — matching the store to the workload.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Pick the store that fits the workload

AWS offers a database for every shape of data. The skill isn't memorizing them —
it's mapping each to the **workload** concepts you already know (OLTP vs OLAP,
relational vs NoSQL).

## RDS / Aurora — managed relational (OLTP)

**RDS** (Relational Database Service) runs managed **PostgreSQL/MySQL/etc.** — AWS
handles backups, patching, replicas, failover; you use the SQL you already know.
**Aurora** is AWS's cloud-native, higher-performance MySQL/Postgres-compatible engine.

- **Workload:** **OLTP** — many small, fast reads/writes of individual rows; the
  transactional app database (orders, users). Row-oriented, normalized.

## DynamoDB — managed NoSQL (key-value/document)

Serverless **NoSQL**: single-digit-millisecond lookups at any scale, no schema, no
servers. You design around **access patterns** (a partition key), not normalized
tables — and you give up ad-hoc joins/SQL.

- **Workload:** massive-scale key lookups — user sessions, IoT device state, a
  shopping cart, a feature store. "Get item by key, fast, at any volume."

## Redshift — data warehouse (OLAP)

AWS's **columnar, MPP** (massively parallel processing) **data warehouse**. Stores
data by column and spreads queries across many nodes — built to scan billions of rows
for **analytics**, exactly the warehouse you modeled with star schemas.

- **Workload:** **OLAP** — large aggregations, joins over fact/dimension tables, BI
  dashboards. **Redshift Spectrum** even queries Parquet directly in S3.

# The decision

| You need… | Use |
|---|---|
| Transactional app DB, SQL, joins, normalized | **RDS / Aurora** (OLTP) |
| Huge-scale fast key lookups, flexible schema | **DynamoDB** (NoSQL) |
| Analytics/BI over huge tables, aggregations | **Redshift** (OLAP warehouse) |
| SQL over files in S3 without loading | **Athena** (next lesson) |

The classic mistake is running analytics on the OLTP database until it melts —
row-oriented OLTP stores and columnar OLAP warehouses are built for opposite access
patterns. Right store, right job.`,
        },
        {
          kind: "quiz",
          question: "Analysts run heavy `GROUP BY` aggregations over a billion-row fact table and it's crushing the production Postgres (RDS) app database. What's the right architecture?",
          options: [
            {
              text: "Move analytics to a columnar OLAP warehouse (Redshift), loaded from the OLTP DB — row-oriented RDS is built for transactions, not full-table scans/aggregations",
              correct: true,
            },
            { text: "Add more indexes to the RDS Postgres until the scans are fast" },
            { text: "Switch the app to DynamoDB" },
            { text: "Run the aggregations in Lambda" },
          ],
          explanation:
            "OLTP (row-oriented RDS) excels at small point reads/writes; large analytical scans want a columnar MPP warehouse (Redshift) that reads only needed columns across parallel nodes. Separating transactional and analytical stores is a foundational data-architecture move.",
        },
        {
          kind: "quiz",
          question: "Which workload is the best fit for DynamoDB rather than RDS or Redshift?",
          options: [
            {
              text: "Millions of users' shopping-cart/session state fetched by user_id with single-digit-ms latency at any scale — a known key-based access pattern, no ad-hoc joins",
              correct: true,
            },
            { text: "Ad-hoc SQL joins across normalized tables for a report" },
            { text: "Scanning a billion-row fact table for a quarterly aggregation" },
            { text: "A finance ledger needing multi-row ACID transactions and complex SQL" },
          ],
          explanation:
            "DynamoDB is built for high-volume, low-latency lookups on a known key with a flexible schema — you design for the access pattern up front. Ad-hoc joins/SQL point to RDS; big analytical scans point to Redshift.",
        },
        {
          kind: "flashcards",
          title: "AWS databases",
          cards: [
            { front: "RDS / Aurora", back: "Managed relational SQL (Postgres/MySQL). OLTP: many small fast row reads/writes — the transactional app database. Aurora = AWS's higher-performance engine." },
            { front: "DynamoDB", back: "Serverless NoSQL key-value/document store. Single-digit-ms lookups at any scale; design around access patterns (partition key), no ad-hoc joins/SQL." },
            { front: "Redshift", back: "Columnar, MPP data warehouse for OLAP: aggregations/joins over huge fact+dimension tables. Spectrum queries Parquet directly in S3." },
            { front: "OLTP vs OLAP store", back: "OLTP = row-oriented, point reads/writes (RDS). OLAP = column-oriented, big scans/aggregations (Redshift). Opposite access patterns → separate systems." },
            { front: "Classic anti-pattern", back: "Running heavy analytics on the OLTP app DB until it melts. Fix: replicate/load into a columnar warehouse for analysis." },
            { front: "Choosing a store", back: "Transactional+SQL → RDS/Aurora; huge key lookups → DynamoDB; analytics over huge tables → Redshift; SQL over S3 files → Athena." },
          ],
        },
      ],
    },
    {
      id: "aws-data-stack",
      title: "The AWS Data Stack",
      summary: "Glue, Athena, EMR, Kinesis, Step Functions — mapped to what you know.",
      minutes: 15,
      blocks: [
        {
          kind: "prose",
          markdown: `# The managed versions of everything you learned

AWS has a service for each stage of a data pipeline. The fast way to learn them is to
map each onto a concept you already own:

| AWS service | What it is | You already know it as |
|---|---|---|
| **S3** | object storage | the data lake / bronze-silver-gold layers |
| **Glue Data Catalog** | central table/schema metastore | the "what tables/columns exist" catalog |
| **Glue ETL** | serverless Spark ETL jobs | Spark / PySpark transforms |
| **Athena** | serverless SQL over S3 files | SQL on Parquet (like Spark SQL / dbt on files) |
| **Redshift** | columnar MPP warehouse | the star-schema data warehouse |
| **EMR** | managed Hadoop/Spark clusters | your own big Spark cluster |
| **Kinesis / MSK** | streaming ingest | Kafka topics & streaming |
| **Step Functions / MWAA** | orchestration (MWAA = managed Airflow) | Airflow DAGs |
| **Lake Formation** | lake permissions/governance | fine-grained access on the lake |

# Athena: serverless SQL on the lake

**Athena** runs standard SQL directly on files in S3 — no cluster, no loading. It reads
table definitions from the **Glue Data Catalog**, and **you pay per terabyte scanned.**
That pricing model makes two things you already learned into *money*:

- **Partitioning** — a \`WHERE year=2026 AND month=02\` prunes to one prefix, so Athena
  scans a sliver instead of the whole table.
- **Columnar formats (Parquet)** — Athena reads only the columns your query needs, not
  every byte of every row.

Together they can cut a query's scanned bytes — and its bill — by 10–100×. This is why
the physical layout lessons weren't academic: on Athena, layout *is* cost.

# A reference pipeline

\`\`\`
Kinesis / Glue  →  S3 bronze (raw)  →  Glue ETL / dbt  →  S3 silver/gold (Parquet, partitioned)
                                                              │
                                              Athena  or  Redshift (BI / dashboards)
        orchestrated end-to-end by Step Functions / MWAA (Airflow)
\`\`\`

Every box is a service, but the *shape* is the medallion lakehouse you already built —
AWS just provides managed implementations of each stage.`,
        },
        {
          kind: "runnable",
          title: "Why partitioning + columnar slashes the Athena bill",
          code: `PRICE_PER_TB = 5.0        # Athena ~ $5 per TB scanned
GB = 1 / 1024             # 1 GB in TB

# A table: 12 months x ~50 GB/month of raw data, 8 columns.
months = 12
gb_per_month = 50
num_columns = 8

# Query: SELECT amount FROM orders WHERE month = '02'   (1 column, 1 month)
def scan_cost(gb_scanned):
    return gb_scanned * GB * PRICE_PER_TB

# 1) Naive: unpartitioned CSV -> scan the WHOLE table, ALL columns
full = months * gb_per_month
print(f"Unpartitioned CSV, full scan:   {full:>6.0f} GB  ->  \${scan_cost(full):.3f}")

# 2) Partitioned by month -> scan ONE month (all columns still, it's CSV)
one_month = gb_per_month
print(f"Partitioned (1 month), CSV:     {one_month:>6.0f} GB  ->  \${scan_cost(one_month):.3f}")

# 3) Partitioned + Parquet -> ONE month AND only 1 of 8 columns
one_col = gb_per_month / num_columns
print(f"Partitioned + Parquet (1 col):  {one_col:>6.1f} GB  ->  \${scan_cost(one_col):.3f}")

print(f"\\nLayout alone cut the scan {full / one_col:.0f}x  — same query, same result.")
print("On Athena, the physical layout of your data IS a line item on the bill.")`,
        },
        {
          kind: "quiz",
          question: "Athena charges per terabyte scanned. Which two design choices most reduce the cost of a typical `SELECT a, b FROM t WHERE dt = '2026-02-01'`?",
          options: [
            {
              text: "Partition the data by date (so the WHERE prunes to one prefix) and store it as columnar Parquet (so only columns a and b are read)",
              correct: true,
            },
            { text: "Add more Athena nodes and run the query at night" },
            { text: "Store the data as one giant uncompressed CSV for simplicity" },
            { text: "Use SELECT * so Athena can cache everything" },
          ],
          explanation:
            "Partition pruning cuts the ROWS scanned to the matching prefix; columnar Parquet cuts the COLUMNS read to just a and b. Combined they shrink scanned bytes (and the bill) by orders of magnitude — the concrete payoff of the storage-layout lessons.",
        },
        {
          kind: "quiz",
          question: "How should you think about Glue, Athena, Redshift, Kinesis, and MWAA when learning them?",
          options: [
            {
              text: "As managed AWS implementations of concepts you already know — Glue≈Spark ETL + a catalog, Athena≈SQL on files, Redshift≈the warehouse, Kinesis≈Kafka, MWAA≈Airflow",
              correct: true,
            },
            { text: "As five unrelated products with nothing in common" },
            { text: "As replacements for SQL and Python you no longer need" },
            { text: "As services that only work if you use all of them together" },
          ],
          explanation:
            "The AWS data stack is the same pipeline you've built — ingest, store, transform, serve, orchestrate — with managed services swapped in per stage. Mapping each to its underlying concept turns a wall of product names into things you already understand.",
        },
        {
          kind: "flashcards",
          title: "AWS data stack",
          cards: [
            { front: "Glue Data Catalog", back: "A central metastore of table/column/partition metadata over your S3 data. Athena, Redshift Spectrum, and EMR all read it to know 'what tables exist'." },
            { front: "Glue ETL", back: "Serverless Spark ETL jobs (plus crawlers that infer schemas). The managed version of your PySpark transforms." },
            { front: "Athena", back: "Serverless SQL directly over S3 files, using the Glue Catalog. Pay per TB scanned — so partitioning + Parquet directly cut cost." },
            { front: "EMR", back: "Managed Hadoop/Spark clusters for big custom batch — your own Spark cluster, provisioned and scaled by AWS (often on Spot)." },
            { front: "Kinesis / MSK", back: "Streaming ingest. Kinesis = AWS-native streams; MSK = managed Kafka. The Kafka topics/partitions model from the streaming track." },
            { front: "Step Functions / MWAA", back: "Orchestration. Step Functions = AWS state-machine workflows; MWAA = Managed Workflows for Apache Airflow (your DAGs, managed)." },
            { front: "Layout = cost on Athena", back: "Because you pay per byte scanned, partition pruning + columnar Parquet can cut a query's scanned data (and bill) 10–100×." },
          ],
        },
      ],
    },
    {
      id: "aws-pipeline-cost",
      title: "Building & Operating a Data Pipeline",
      summary: "A reference lakehouse on AWS, plus cost & operations basics.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Putting it together: a lakehouse on AWS

Everything so far assembles into the **medallion lakehouse** you built earlier, now as
managed AWS services:

\`\`\`
                 ┌─────────── orchestration: Step Functions / MWAA (Airflow) ───────────┐
                 ▼                                                                       ▼
ingest ─▶ S3 BRONZE ─▶ Glue/EMR ─▶ S3 SILVER ─▶ dbt/Glue ─▶ S3 GOLD ─▶ Athena / Redshift ─▶ BI
(Kinesis,   (raw,        (clean,      (conformed,   (Parquet,    (star schema        (dashboards)
 batch)      immutable)   validated)   partitioned)  aggregates)  / marts)
\`\`\`

- **Ingest** raw events/files into **S3 bronze** (immutable, exactly as received).
- **Transform** with **Glue** (serverless Spark) or **EMR** (big Spark) into **silver**
  (cleaned, deduped, validated) and **gold** (business-level aggregates), stored as
  **partitioned Parquet**.
- **Serve** with **Athena** (SQL on the gold layer) or **Redshift** (loaded marts) to
  BI tools.
- **Orchestrate** the whole DAG with **Step Functions** or **MWAA**, and gate changes
  through the **Git + CI** workflow from earlier tracks.
- **Govern** access with **IAM** + **Lake Formation** (least privilege on the lake).

You've now seen this exact shape three times — dbt marts, the Databricks medallion,
and here. The pattern is portable; the vendor is a detail.

# Cost & operations you can't ignore

Cloud bills surprise teams because everything is pay-per-use. The big data levers:

- **S3 scan cost** — partition + use columnar Parquet (Athena/Redshift Spectrum bill
  per byte scanned). The single biggest analytics cost lever.
- **Storage tiering** — lifecycle old data to IA/Glacier.
- **Spot for batch** — fault-tolerant Spark on Spot saves up to ~90%.
- **Turn it off** — idle clusters (EMR/Redshift) burn money 24/7; use auto-pause,
  serverless (Athena, Redshift Serverless, Fargate), and scale-to-zero.
- **Data transfer** — cross-region/egress is billed; keep compute next to data.
- **Tagging** — tag resources by team/project so you can attribute the bill and hunt
  waste.

# Observability

- **CloudWatch** — metrics, logs, and alarms (e.g. "alert if the nightly job's error
  count > 0", "alert if S3 spend spikes"). The AWS-native version of the monitoring &
  alerting you saw in the Data Quality track.
- **CloudTrail** — an audit log of every API call (who did what, when) — essential for
  security review and debugging "who deleted that table?".

Right-sizing, turning things off, and watching the bill aren't afterthoughts — on the
cloud, cost is a first-class engineering constraint.`,
        },
        {
          kind: "quiz",
          question: "An EMR Spark cluster runs a 2-hour job each night but is left running 24/7. What's the highest-leverage fix?",
          options: [
            {
              text: "Make it transient — spin the cluster up for the job and terminate it after (and run workers on Spot); pay for ~2 hours instead of 24, saving the idle time",
              correct: true,
            },
            { text: "Upgrade to larger instances so the job finishes faster" },
            { text: "Move the cluster to a different region" },
            { text: "Add more S3 buckets to spread the load" },
          ],
          explanation:
            "Idle compute is pure waste under pay-per-use. Transient/auto-terminating clusters (or serverless equivalents) bill only for the work, and Spot workers cut the per-hour rate further for retryable batch. 'Turn it off when idle' is the first cost reflex.",
        },
        {
          kind: "quiz",
          question: "Which AWS service gives you an audit trail of 'who called which API and when' — e.g. to find who deleted a table?",
          options: [
            { text: "CloudTrail — it logs every AWS API call (identity, action, time, resource) for security and forensics", correct: true },
            { text: "CloudWatch — it collects metrics/logs/alarms, but not a per-call identity audit trail" },
            { text: "S3 lifecycle policies" },
            { text: "IAM policies" },
          ],
          explanation:
            "CloudTrail is the API audit log (who/what/when/where) — the go-to for 'who deleted that?' and compliance. CloudWatch is for operational metrics, logs, and alarms. They're complementary: CloudTrail for audit, CloudWatch for monitoring/alerting.",
        },
        {
          kind: "flashcards",
          title: "Pipeline, cost & ops",
          cards: [
            { front: "AWS lakehouse shape", back: "Ingest→S3 bronze→Glue/EMR→silver→dbt/Glue→gold→Athena/Redshift→BI, orchestrated by Step Functions/MWAA. The medallion pattern in managed services." },
            { front: "Biggest analytics cost lever", back: "Reduce bytes scanned: partition the data and store columnar Parquet (Athena/Spectrum bill per byte scanned)." },
            { front: "Turn it off", back: "Idle EMR/Redshift clusters bill 24/7. Use transient clusters, auto-pause, and serverless (Athena, Redshift Serverless, Fargate) to scale to zero." },
            { front: "Spot for batch", back: "Run fault-tolerant Spark workers on Spot instances for up to ~90% savings — Spark retries reclaimed tasks." },
            { front: "Data transfer cost", back: "Cross-region and egress traffic is billed. Keep compute in the same region as its data to avoid surprise charges." },
            { front: "CloudWatch vs CloudTrail", back: "CloudWatch = metrics, logs, alarms (monitoring/alerting). CloudTrail = audit log of every API call (who did what, when)." },
            { front: "Tagging", back: "Tag resources by team/project to attribute the bill and find waste. Cost is a first-class engineering constraint on the cloud." },
          ],
        },
      ],
    },
  ],
};
