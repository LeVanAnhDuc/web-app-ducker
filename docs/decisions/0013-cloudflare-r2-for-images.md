# ADR-0013 · Cloudflare R2 for images

> **Date:** 2026-08-17
> **Status:** accepted
> **Related:** FR-12 · US-07

## 1. Context

The site needs uploaded diagrams and screenshots. The infrastructure ceiling is $0/month
and the deployment target is Vercel.

## 2. Decision

Cloudflare R2, behind `src/server/media/` — the only module that knows the S3 SDK.
Dimensions are read from the image header with `image-size` after the MIME type is
confirmed and before the upload.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Vercel Blob | Ties image storage to the host, so moving hosts means moving every URL |
| Images committed to the repo | Content must be editable without a deploy — the same reason the text is not in markdown files |
| Amazon S3 | Egress is billed; R2's is free, which matters for a public site |

## 4. Consequences

**Gained:** 10 GB free, free egress, a standard S3 API, no lock-in to the host.

**Lost / accepted:**
- Public access on the bucket is a **separate step**, and skipping it makes
  `R2_PUBLIC_BASE_URL` useless while every image 404s. Written down at
  [`../05-operations/runbook.md`](../05-operations/runbook.md) §2.4 because it is invisible until it bites.
- Measuring dimensions **never throws**: a failed measurement stores `null` and the
  image still uploads, because the size is nice-to-have and not an admission condition.
  Worth stating because the obvious implementation does the opposite. Measured first
  rather than assumed: `image-size` *can* infer SVG dimensions from `viewBox` even when
  `width="100%"`, and it *does* throw on junk data and empty buffers.

**Revisit when:** the free tier runs out, or a CDN with image transforms becomes worth
paying for.
