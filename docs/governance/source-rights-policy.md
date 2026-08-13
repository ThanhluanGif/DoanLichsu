# Source, provenance và quyền sử dụng v1.0

Status: `DRAFT_PENDING_COUNCIL_SIGNOFF`  
Owner: Archivist/Rights  
Last reviewed: 2026-08-13

## Source hierarchy

`T1` văn kiện gốc, văn bản nhà nước, hồ sơ lưu trữ; `T2` bảo tàng, thư viện, viện
nghiên cứu và chuyên khảo; `T3` UNESCO/thư viện quốc tế/nghiên cứu uy tín; `T4`
Wikimedia Commons, Wikidata, Wikipedia cho discovery, identifier và media có license;
`T5` báo/blog/mạng xã hội chỉ để phát hiện câu hỏi. T4/T5 không là căn cứ duy nhất
cho claim nhạy cảm.

## Required record

Every source stores canonical URL, title, publisher/creator, source tier/type, version or
revision, locator, accessedAt, provenance note, verification status, reviewer and review
date. A media record additionally stores license, rightsStatus, attribution, original
URL, derivative hash, permission document (if any), takedown contact and recheck date.

## Wikimedia rule

Import metadata and revision identifiers into a review queue only. Never auto-publish,
hotlink blindly, or treat Wikimedia metadata as a rights guarantee. A reviewer checks
the individual file license, attribution, ShareAlike/other conditions and source page.
If rights are unclear, serve `LINK_ONLY` or do not serve the binary.

## Takedown

Record request time, claimant/contact, affected asset, temporary action, rights review,
decision, approver and resolution date. A credible request can trigger immediate
unpublish while the case is investigated. Preserve an audit trail without exposing
private claimant data.
