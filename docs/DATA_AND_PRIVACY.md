# StoryBridge data and privacy

This describes the intended data flow in the repository; it is not a legal compliance certification.

## Teacher accounts

The app includes registration, login and a Base44 User entity with a role field. Base44 processes teacher account identifiers and authentication/session information. Review Base44 app-level retention, account deletion, logs and backup settings separately.

## Lesson data

The lesson workflow accepts:
- Class level.
- A learning objective.
- Lesson duration and teaching materials.
- Up to four teacher-selected cultural anchors.
- Qloo candidate IDs/names/affinity metadata when the teacher reviews and selects them.

The application does not request pupil names, pupil email addresses, individual learning profiles or sensitive student records. Do not enter such data in lesson objectives, materials, cultural anchors or free text.

Generated lesson content is returned to the browser for the current session; StoryBridge does not intentionally save lesson history to its own database. A teacher may save/print a handout locally.

## Third-party processing

- Base44 processes authentication and invokes the hosted LLM integration for lesson generation.
- Qloo receives teacher-selected cultural anchors through server-side requests when its secret is configured.
- Qloo's API data and usage remain subject to the current Qloo agreement.
- The app should not send pupil information to Base44, Qloo or a model provider.

## Security controls

Both server functions now create an authenticated Base44 client from the request and verify that an active teacher account is present before performing service-role model calls or using the Qloo API secret.

This does not replace a review of the live Base44 function access settings, app visibility, admin roles, secret permissions or platform logs. Confirm those settings in the deployed app.

## Further work

Before institutional school deployment, document lawful basis, notices, data-subject request handling, account deletion, retention, subprocessors, regional data handling and school approval. Avoid describing the app as compliant with a privacy regime without a deployment-specific assessment.
