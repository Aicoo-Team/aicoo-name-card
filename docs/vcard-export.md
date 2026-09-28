# Agent-preserving contact export

## Contract

- Keep vCard 3.0, CRLF delimiters, and a final CRLF.
- Preserve existing name, company, title, contact details, biography, and photo.
- Prefer `card.agent.agentUrl`, falling back to `card.agent.url` if missing/invalid.
- Skip an Agent marked `isActive: false`. An absent flag preserves legacy cards.
- Only export absolute HTTP(S) links without embedded credentials or CR/LF.
- Use a grouped standard `URL` plus `X-ABLabel:Aicoo Agent`; contact applications
  that ignore the label can still read a plain-language link in `NOTE`.
- Do not use the vCard `AGENT` property: it describes another vCard, not a chat UI.
- Escape TEXT values but not URI punctuation. Fold long lines at 75 UTF-8 bytes
  without splitting code points. Include required `N` without guessing surname.

Reference: https://www.rfc-editor.org/rfc/rfc2426

Export uses the stored card snapshot. It does not check live link expiry, alter
sharing permissions, or revoke previously downloaded files. A saved link can
still require login or subsequently expire/be revoked on Aicoo.

## Automated coverage

`npm test` covers ordinary cards, preferred/fallback Agent links, inactive Agents,
invalid URLs, embedded credentials, CR/LF injection, Unicode folding, URI
punctuation, and preservation of existing contact fields. No network or DB needed.

## Manual acceptance still required

1. With a development card that has a website, bio, and an active Shared Agent,
   download its `.vcf` using Save.
2. Import on iPhone Contacts and Android/Google Contacts.
3. Verify the display name, ordinary website, original bio, and Agent URL survive.
4. If the custom URL label is ignored, confirm the Agent link is present in Notes.
5. Open the link and verify the correct Agent, including any login requirement.
6. Repeat without an Agent, with only the fallback URL, and with Chinese/emoji.

These are pending device checks, not claimed by unit-test or build success.
