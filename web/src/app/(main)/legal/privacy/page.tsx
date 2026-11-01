import { Box, Container, Typography } from '@mui/material';

export default function Privacy() {
    return (
        <Container
            sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
        >
            <Typography variant="h4" component="h1">
                PlayBingo Privacy Policy
            </Typography>
            <Box sx={{ display: 'flex', columnGap: 1 }}>
                <Typography sx={{ fontWeight: 'bold' }}>
                    Effective Date:
                </Typography>
                <Typography>October 26, 2026</Typography>
            </Box>
            <Typography>
                Bingothon C.I.C., a community interest company registered in
                England and Wales, operates PlayBingo and is the controller of
                personal information described here (&quot;we,&quot;
                &quot;us,&quot; or &quot;our&quot;). This Privacy Policy
                explains how we collect, use, store, and protect information
                when you use the PlayBingo website, services, APIs, and related
                features (collectively, the &quot;Service&quot;).
            </Typography>
            <Typography>
                This policy explains our data practices and your rights. It does
                not replace any consent required by applicable law.
            </Typography>
            <Typography>
                PlayBingo is built around community ownership. We do not sell
                personal information, and we do not use personal information for
                targeted advertising.
            </Typography>
            <Typography variant="h5">1. Information We Collect</Typography>
            <Typography>
                The information we collect depends on how you use PlayBingo. We
                collect information directly from you, automatically through
                your use of the Service, and from users or communities who
                submit content or interact with you through the Service.
            </Typography>
            <Typography>
                Providing account information is necessary to create and secure
                an account. Without it, account-based features may be
                unavailable. You can choose whether to submit optional content.
            </Typography>
            <Typography variant="h6">Account Information</Typography>
            <Typography>
                If you create an account, we may collect information necessary
                to provide and secure your account, such as:
            </Typography>
            <ul style={{ marginTop: 0, marginBottom: 0 }}>
                <li>username or display name</li>
                <li>email address, where applicable</li>
                <li>authentication information</li>
                <li>account preferences</li>
                <li>information associated with your use of PlayBingo.</li>
            </ul>
            <Typography>
                We collect information reasonably necessary to provide the
                functionality associated with your account.
            </Typography>
            <Typography variant="h6">Game and Community Data</Typography>
            <Typography>
                PlayBingo stores information that users and communities provide
                when creating, managing, and playing games. This may include:
            </Typography>
            <ul style={{ marginTop: 0, marginBottom: 0 }}>
                <li>game definitions and configurations</li>
                <li>goals and descriptions</li>
                <li>images and other uploaded assets</li>
                <li>game settings</li>
                <li>game-room information</li>
                <li>player actions and game state</li>
                <li>other content submitted through the Service.</li>
            </ul>
            <Typography>
                Game and community data remains the intellectual property of the
                person or community that owns it. PlayBingo does not claim
                ownership of this content.
            </Typography>
            <Typography>
                Information intentionally made public through PlayBingo may be
                visible to other users and, depending on the feature, may be
                accessible through PlayBingo&apos;s APIs.
            </Typography>
            <Typography variant="h6">Technical and Operational Logs</Typography>
            <Typography>
                When you use PlayBingo, our systems record technical information
                necessary to operate, secure, troubleshoot, and understand use
                of the Service. For most requests, our standard informational
                logs may include:
            </Typography>
            <ul style={{ marginTop: 0, marginBottom: 0 }}>
                <li>a session identifier;</li>
                <li>IP address;</li>
                <li>user agent;</li>
                <li>request method and path; and</li>
                <li>the resulting response or status.</li>
            </ul>
            <Typography>
                A narrow subset of requests may be excluded from some or all
                standard logging where appropriate. Additional information may
                be recorded in targeted logs when reasonably necessary to
                investigate an error, reproduce a problem, address security or
                usage concerns, or otherwise maintain the Service. Such logging
                is intended to contain only information reasonably necessary for
                the relevant purpose.
            </Typography>
            <Typography>
                Operational logs are retained for a period of approximately one
                week. Error and diagnostic logs may be retained for longer
                periods where needed to investigate a particular issue or meet a
                legal requirement. Personal information in these logs remains
                subject to the retention criteria in section 8.
            </Typography>
            <Typography variant="h6">Analytics and Metrics</Typography>
            <Typography>
                PlayBingo collects metrics and analytics to understand how the
                Service is used, monitor its operation, identify problems,
                measure performance, and guide development.
            </Typography>
            <Typography>
                We do not use a third-party analytics service to collect or sell
                information about individual users. Analytics are used primarily
                in aggregated or de-identified form. Where these records can
                still identify or be linked to an individual, we treat them as
                personal information.
            </Typography>
            <Typography variant="h5">2. How We Use Information</Typography>
            <Typography>We may use information we collect to:</Typography>
            <ul style={{ marginTop: 0, marginBottom: 0 }}>
                <li>provide and operate PlayBingo</li>
                <li>authenticate users and maintain account security</li>
                <li>host and display community-created games and content</li>
                <li>provide APIs and integrations</li>
                <li>monitor the health and performance of the Service</li>
                <li>maintain, troubleshoot, and debug the Service</li>
                <li>
                    detect abuse, fraud, security problems, and other misuse
                </li>
                <li>enforce rate limits and other usage restrictions</li>
                <li>understand Service usage and improve PlayBingo</li>
                <li>respond to support requests</li>
                <li>develop new features and functionality</li>
                <li>comply with legal obligations</li>
                <li>
                    protect the rights, safety, and security of PlayBingo, its
                    users, and others.
                </li>
            </ul>
            <Typography>
                We do not sell personal information. We do not use personal
                information for behavioral advertising or targeted advertising.
            </Typography>
            <Typography variant="h6">Legal Bases for Processing</Typography>
            <Typography>
                Where the UK GDPR or EU GDPR applies, we process account,
                authentication, and game information as necessary to provide the
                Service you request under our Terms. We process information for
                security, abuse prevention, troubleshooting, support, usage
                analysis, and development on the basis of our legitimate
                interests in operating, protecting, and improving PlayBingo,
                where those interests are not overridden by your rights and
                interests.
            </Typography>
            <Typography>
                We also process information where necessary to comply with legal
                obligations. Where consent is required, including for optional
                disclosures to third parties, we rely on your consent. You may
                withdraw that consent by contacting us; withdrawal does not
                affect processing that was lawful before withdrawal.
            </Typography>
            <Typography variant="h5">3. How We Share Information</Typography>
            <Typography>
                We do not sell personal information. We do not otherwise provide
                personal information to third parties for their independent use
                without your express consent, except where disclosure is
                required by law. Hosting and infrastructure processing on our
                behalf, and content you choose to share through the Service, are
                described below.
            </Typography>
            <Typography>
                We may disclose or provide access to information in the
                following circumstances:
            </Typography>
            <Typography variant="h6">Infrastructure Providers</Typography>
            <Typography>
                Hosting providers supply the underlying infrastructure for our
                self-hosted services and may have technical access to that
                infrastructure as part of providing their hosting services. We
                do not authorize infrastructure providers to use PlayBingo user
                information for their own advertising, marketing, or unrelated
                purposes.
            </Typography>
            <Typography variant="h6">Legal Requirements</Typography>
            <Typography>
                We may disclose information to courts, regulators, or other
                competent authorities where required by applicable law or
                binding legal process.
            </Typography>
            <Typography variant="h6">With Your Direction</Typography>
            <Typography>
                We may disclose information when you explicitly request or
                authorize us to do so. For example, information may be shared
                through a third-party integration you expressly authorize.
            </Typography>
            <Typography variant="h5">4. Access by PlayBingo Staff</Typography>
            <Typography>
                System information and technical logs may be accessible to
                authorized PlayBingo staff when necessary to operate, maintain,
                secure, debug, or support the Service.
            </Typography>
            <Typography variant="h5">
                5. Public Information and Community Content
            </Typography>
            <Typography>
                PlayBingo is a community platform, and some information is
                intentionally made public by users. For example, a community may
                choose to publish a game, its goals, game settings, or other
                content so that other people can access and play the game.
            </Typography>
            <Typography>
                Information that you or another user intentionally makes public
                through the Service may be viewed, copied, or otherwise used by
                other people. We cannot control how other users use information
                that has been made publicly available.
            </Typography>
            <Typography>
                Please do not submit personal or confidential information to
                public areas of the Service.
            </Typography>
            <Typography variant="h5">
                6. Cookies and Session Technologies
            </Typography>
            <Typography>
                PlayBingo may use cookies, local storage, session identifiers,
                or similar technologies necessary to authenticate users,
                maintain sessions, remember preferences, provide functionality,
                and maintain the security of the Service.
            </Typography>
            <Typography>
                Session identifiers may also appear in operational logs as
                described above. We do not use cookies or similar technologies
                for third-party behavioral advertising.
            </Typography>
            <Typography variant="h5">7. External Support Services</Typography>
            <Typography>
                PlayBingo does not currently process payments or financial
                transactions through the Service. Users may optionally support
                PlayBingo through external services, such as Patreon.
            </Typography>
            <Typography>
                When you use an external service to provide financial support,
                the transaction is handled by that service and is subject to its
                own terms and privacy policy. PlayBingo does not receive or
                process payment credentials submitted directly to those
                services.
            </Typography>
            <Typography variant="h5">8. Data Retention</Typography>
            <Typography>
                We retain information for as long as reasonably necessary to
                provide the Service, maintain security, comply with legal
                obligations, resolve disputes, enforce our agreements, and
                perform legitimate operational functions. Different categories
                of information may have different retention periods.
            </Typography>
            <Typography>
                Standard operational request logs are generally retained for
                approximately one week. Error and diagnostic logs may be
                retained for substantially longer periods where needed to
                investigate a particular issue or meet a legal requirement.
                Their retention depends on the nature and severity of the issue,
                whether an investigation remains open, and any applicable legal
                retention period; personal information is not retained
                indefinitely merely because it might be useful.
            </Typography>
            <Typography>
                Application data, account information, and community content may
                be retained while necessary to provide the Service or until
                deleted by the relevant user or community, subject to legal,
                security, backup, and other legitimate operational requirements.
            </Typography>
            <Typography>
                Personal information is deleted or anonymized when it is no
                longer necessary for these purposes. Backup copies may persist
                until the relevant backup is overwritten or expires; retained
                copies remain subject to the same protections.
            </Typography>
            <Typography variant="h5">
                9. Account and Content Deletion
            </Typography>
            <Typography>
                You may request deletion of your account or personal information
                by contacting us at staff@playbingo.gg, subject to applicable
                law. Operational convenience alone does not override a legal
                right to erasure.
            </Typography>
            <Typography>
                Deleting an account does not necessarily result in immediate
                deletion of all information. We may retain information when
                necessary for security, fraud prevention, legal obligations,
                dispute resolution, backups, or other legitimate purposes.
            </Typography>
            <Typography>
                Deleting an account does not necessarily remove shared community
                game content. Any personal information within that content
                remains subject to applicable privacy rights, including erasure
                rights where they apply.
            </Typography>
            <Typography variant="h5">10. Security</Typography>
            <Typography>
                We take reasonable technical and organizational measures to
                protect information against unauthorized access, alteration,
                disclosure, and destruction.
            </Typography>
            <Typography>
                PlayBingo uses multiple layers of access controls to restrict
                access to production infrastructure, operational logs, and other
                sensitive systems.
            </Typography>
            <Typography>
                No internet service can guarantee absolute security. We
                therefore cannot guarantee that information transmitted to or
                stored by PlayBingo will never be accessed, altered, disclosed,
                or destroyed through a security incident.
            </Typography>
            <Typography variant="h5">11. Children&apos;s Privacy</Typography>
            <Typography>
                PlayBingo serves a general worldwide audience and is not
                specifically directed toward children. Our Terms require users
                to be at least 13 years old and, where they are below the age of
                majority, to have parental or guardian consent. Additional age
                or parental-authorization requirements under applicable law
                still apply.
            </Typography>
            <Typography>
                If we learn that we have collected personal information from a
                child in breach of applicable age or parental-authorization
                requirements, we will take the steps required by applicable law,
                including deletion where required.
            </Typography>
            <Typography>
                If you believe a child has provided personal information to
                PlayBingo, please contact us at staff@playbingo.gg.
            </Typography>
            <Typography variant="h5">12. Your Privacy Rights</Typography>
            <Typography>
                Depending on where you live, you may have legal rights
                concerning your personal information, including rights to
                request access, correction, erasure, restriction of processing,
                and portability. These rights are subject to the conditions and
                exceptions in applicable law.
            </Typography>
            <Typography>
                You may contact us at staff@playbingo.gg to exercise applicable
                privacy rights or ask questions about our handling of personal
                information. We will process requests in accordance with
                applicable law.
            </Typography>
            <Typography>
                Right to object: Where we rely on legitimate interests, you may
                object to processing on grounds relating to your particular
                situation. We must stop that processing unless applicable law
                allows us to continue, for example because we demonstrate
                compelling legitimate grounds overriding your interests, rights,
                and freedoms, or the processing is needed for legal claims.
            </Typography>
            <Typography>
                We may need to verify your identity before fulfilling certain
                requests. Nothing in this Privacy Policy limits privacy rights
                that cannot legally be waived.
            </Typography>
            <Typography variant="h5">13. California Residents</Typography>
            <Typography>
                Where California privacy laws apply, you may have additional
                rights concerning your personal information, including rights to
                know, access, correct, delete, and limit or opt out of certain
                uses or disclosures of personal information.
            </Typography>
            <Typography>
                PlayBingo does not sell personal information and does not share
                personal information for cross-context behavioral advertising.
            </Typography>
            <Typography>
                California residents may submit privacy requests using
                staff@playbingo.gg.
            </Typography>
            <Typography>
                We will handle qualifying requests in accordance with applicable
                California law, including applicable rights to use an authorized
                agent and to exercise your rights without unlawful
                discrimination.
            </Typography>
            <Typography variant="h5">
                14. Changes to This Privacy Policy
            </Typography>
            <Typography>
                We may update this Privacy Policy as PlayBingo&apos;s practices,
                features, infrastructure, or legal obligations change.
            </Typography>
            <Typography>
                When we make material changes, we will provide reasonable notice
                through the Service or by other appropriate means. The updated
                policy will indicate its effective date. Non-material changes
                may be effective immediately without notice. Updating this
                notice does not itself provide consent to new processing; where
                the law requires consent, it must be obtained separately.
            </Typography>
            <Typography variant="h5">15. Contact</Typography>
            <Typography>
                Questions, privacy requests, or concerns regarding this Privacy
                Policy may be sent to:
            </Typography>
            <Typography>staff@playbingo.gg</Typography>
            <Typography>PlayBingo</Typography>
            <Typography>
                Bingothon C.I.C., registered in England and Wales
            </Typography>
            <Typography>Company number: 13756480</Typography>
        </Container>
    );
}
