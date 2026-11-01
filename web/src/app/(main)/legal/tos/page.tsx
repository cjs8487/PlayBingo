import { Box, Container, Link, Typography } from '@mui/material';

export default function TermsOfService() {
    return (
        <Container
            sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
        >
            <Typography variant="h4" component="h1">
                Terms of Service
            </Typography>
            <Box sx={{ display: 'flex', columnGap: 1 }}>
                <Typography sx={{ fontWeight: 'bold' }}>
                    Effective Date:
                </Typography>
                <Typography>October 26, 2026</Typography>
            </Box>
            <Typography>
                PlayBingo is operated by Bingothon C.I.C., a community interest
                company registered in England and Wales (&quot;we,&quot;
                &quot;us,&quot; or &quot;our&quot;). These Terms of Service
                (&quot;Terms&quot;) form an agreement between you and Bingothon
                C.I.C. and govern your use of PlayBingo, including its website,
                services, APIs, software, and related features (collectively,
                the &quot;Service&quot;).
            </Typography>
            <Typography>
                By accessing the Service or otherwise indicating that you have
                accepted these Terms, you represent that
            </Typography>
            <ul style={{ marginTop: 0, marginBottom: 0 }}>
                <li>You have read, understand, and agree to these Terms.</li>
                <li>
                    You are at least 13 years old and meet any higher minimum
                    age required by applicable law.
                </li>
                <li>
                    You are of the age of majority in your jurisdiction, or have
                    obtained parental or guardian consent to agree to these
                    Terms.
                </li>
                <li>
                    You have the legal capacity to enter into these Terms and
                    agree to be bound by them.
                </li>
            </ul>
            <Typography>
                PlayBingo&apos;s{' '}
                <Link href="/legal/privacy">Privacy Policy</Link> explains how
                we collect, use, and store personal information when you use the
                Service, and describes your privacy rights. Acceptance of these
                Terms does not constitute consent to processing where separate
                consent is required by law.
            </Typography>
            <Typography variant="h5">1. The PlayBingo Service</Typography>
            <Typography>
                PlayBingo is a community-oriented platform for creating,
                managing, and playing bingo games. PlayBingo provides tools for
                creating and managing games, generating boards, hosting game
                rooms, communicating with other players, integrating with
                third-party services, and accessing game data through APIs.
            </Typography>
            <Typography>
                PlayBingo is provided on an ongoing basis, but we do not
                guarantee that the Service will always be available,
                uninterrupted, secure, or error-free. Features may be added,
                changed, suspended, or discontinued at any time.
            </Typography>
            <Typography>
                PlayBingo is provided free of charge. We do not process payments
                or financial transactions through the Service.
            </Typography>
            <Typography variant="h5">2. Accounts</Typography>
            <Typography>
                Some features require an account. You are responsible for
                maintaining the security of your account and for activity
                occurring through your account.
            </Typography>
            <Typography>
                You must provide accurate information when creating an account
                and must not impersonate another person or use an account
                without authorization.
            </Typography>
            <Typography>
                You are responsible for keeping your authentication credentials
                secure and should notify us if you believe your account has been
                compromised.
            </Typography>
            <Typography variant="h5">
                3. Community and User-Generated Content
            </Typography>
            <Typography>
                PlayBingo allows users and communities to create, upload,
                submit, and otherwise provide content, including game
                definitions, goals, images, descriptions, text, configurations,
                and other materials (&quot;User Content&quot;).
            </Typography>
            <Typography>
                You retain ownership of the User Content you provide to
                PlayBingo. PlayBingo does not claim ownership of your game data
                or other User Content merely because you submit it to or store
                it through the Service.
            </Typography>
            <Typography>
                By submitting User Content, you grant PlayBingo a non-exclusive,
                worldwide, royalty-free license to host, store, reproduce,
                process, modify as technically necessary, transmit, display, and
                otherwise use that User Content solely as reasonably necessary
                to operate, maintain, secure, develop, and provide the Service.
            </Typography>
            <Typography>
                This license continues for as long as necessary to provide the
                Service with respect to the relevant User Content, including
                reasonable backups and technical copies. You may revoke this
                license by removing the relevant User Content, except where
                continued retention is reasonably necessary for legal, security,
                backup, or other legitimate operational purposes.
            </Typography>
            <Typography>
                You are responsible for the User Content you submit. You
                represent that you have the rights and permissions necessary to
                submit that content and to grant the license described above.
            </Typography>
            <Typography>
                PlayBingo does not endorse or assume responsibility for User
                Content and is not responsible for the accuracy, legality,
                availability, or appropriateness of User Content submitted by
                users or communities.
            </Typography>
            <Typography>
                We may remove, restrict, or disable access to User Content that
                we reasonably believe violates these Terms, applicable law, or
                the rights of others.
            </Typography>
            <Typography>
                PlayBingo has a zero-tolerance policy for harassment, threats,
                or other unlawful, unsafe, or otherwise inappropriate conduct
                through User Content. We may remove or restrict access to User
                Content that we reasonably believe violates this policy or falls
                into any of the following categories:
            </Typography>
            <ul style={{ marginTop: 0 }}>
                <li>
                    <b>Harassment, Threats, and Intimidation:</b> Content
                    containing threats, encouragement or glorification of
                    violence, promotion of crime, or instructions on how to
                    commit harmful acts.
                </li>
                <li>
                    <b>Discrimination, Hate Speech, and Hateful Behavior:</b>{' '}
                    Content that promotes hate, intolerance, or discrimination
                    against individuals or groups based on race, ethnicity,
                    religion, gender, sexual orientation, disability, or any
                    other protected characteristic.
                </li>
                <li>
                    <b>Sexual and Physical Abuse:</b> Content that shows,
                    promotes, encourages, or otherwise facilitates sexual abuse
                    or exploitation, including human trafficking and smuggling.
                </li>
                <li>
                    <b>Harassment and Bullying: </b> Content that harasses or
                    bullies other individuals, including, but not limited to,
                    degrading remarks about appearance, sexual orientation,
                    race, religion, or other characteristics, doxing, and other
                    coordinated abuse.
                </li>
                <li>
                    <b>Suicide and Self-Harm:</b> Content that promotes,
                    demonstrates, or provides instructions for suicide or
                    self-harm.
                </li>
                <li>
                    <b>Sensitive and Mature Themes:</b> Content including
                    nudity, sexual activity, extremely graphic, violent, or
                    disturbing content, and content that promotes animal
                    cruelty, neglect, or exploitation.
                </li>
                <li>
                    <b>Personal Information:</b> Content that contains personal
                    information about yourself or another individual in public
                    areas of the Service, particularly information that could
                    lead to harm, such as identity theft, stalking, or fraud.
                </li>
                <li>
                    <b>Illegal Activity:</b> Content that promotes illegal
                    activity.
                </li>
            </ul>
            <Typography variant="h5">
                4. Third-Party Intellectual Property
            </Typography>
            <Typography>
                Games and User Content may refer to video games, characters,
                artwork, trademarks, or other intellectual property owned by
                third parties. That intellectual property remains the property
                of its respective owners. PlayBingo does not claim ownership of
                third-party intellectual property merely because it is displayed
                or used in connection with a game on the Service.
            </Typography>
            <Typography>
                PlayBingo does not grant you any rights to third-party
                intellectual property merely by making it available through the
                Service.
            </Typography>
            <Typography>
                You are responsible for ensuring that content you submit does
                not infringe the intellectual-property rights of others.
            </Typography>
            <Typography variant="h5">5. Copyright Complaints</Typography>
            <Typography>
                If you believe that content available through PlayBingo
                infringes your copyright or other intellectual-property rights,
                please contact us at{}
                <Link href="mailto:staff@playbingo.gg">
                    staff@playbingo.gg
                </Link>{' '}
                with sufficient information for us to identify the material and
                understand your claim.
            </Typography>
            <Typography>
                We may remove or restrict access to material that we reasonably
                believe infringes another person&apos;s rights.
            </Typography>
            <Typography>
                Nothing in these Terms limits rights or remedies that cannot
                legally be waived or limited.
            </Typography>
            <Typography variant="h5">6. Acceptable Use</Typography>
            <Typography>
                You may use PlayBingo only for lawful purposes and in accordance
                with these Terms.
            </Typography>
            <Box>
                <Typography>You may not:</Typography>
                <ul style={{ marginTop: 0 }}>
                    <li>
                        use the Service to violate applicable law or regulations
                    </li>
                    <li>
                        upload or distribute content that you do not have the
                        right to use
                    </li>
                    <li>impersonate another person or organization</li>
                    <li>
                        publish personal or confidential information about
                        yourself or others in public areas of the Service
                    </li>
                    <li>
                        interfere with or attempt to compromise the security or
                        operation of the Service
                    </li>
                    <li>
                        intentionally introduce malicious software or other
                        harmful material
                    </li>
                    <li>
                        abuse APIs, automated systems, or other Service
                        resources in a manner that materially interferes with
                        the Service
                    </li>
                    <li>
                        attempt to access accounts, data, or systems without
                        authorization
                    </li>
                    <li>
                        use the Service to harass, threaten, or unlawfully harm
                        others
                    </li>
                    <li>
                        circumvent technical restrictions or access controls.
                    </li>
                </ul>
                <Typography>
                    These restrictions do not prohibit activities that are
                    otherwise permitted by the applicable open-source licenses
                    governing PlayBingo software.
                </Typography>
            </Box>
            <Typography variant="h5">7. Open-Source Software</Typography>
            <Typography>
                The PlayBingo software is open-source software made available
                under the GNU General Public License version 3.0 (GPL-3.0).
            </Typography>
            <Typography>
                The Service may also use software components that are
                distributed under other open-source or proprietary licenses.
                Those components remain subject to their respective license
                terms.
            </Typography>
            <Typography>
                The PlayBingo source code and license are available in the{' '}
                <Link href="https://github.com/cjs8487/PlayBingo">
                    PlayBingo repository
                </Link>
                . Third-party components remain subject to the notices and
                licenses distributed with them.
            </Typography>
            <Typography>
                These Terms do not replace or restrict rights granted to you
                under applicable open-source licenses.
            </Typography>
            <Typography variant="h5">
                8. Third-Party Services and Infrastructure
            </Typography>
            <Typography>
                PlayBingo may integrate with or rely upon third-party services
                and infrastructure, including hosting providers and external
                services that users may choose to access through PlayBingo.
            </Typography>
            <Typography>
                Your use of third-party services may be subject to their own
                terms and privacy policies.
            </Typography>
            <Typography>
                PlayBingo is not responsible for the availability,
                functionality, policies, or practices of third-party services.
            </Typography>
            <Typography variant="h5">
                9. Changes, Suspension, and Termination
            </Typography>
            <Typography>
                We may modify these Terms to reflect changes in the Service,
                address security or abuse, clarify their wording, or comply with
                changes in law. When we make material changes, we will provide
                reasonable notice through the Service or by other appropriate
                means. Material changes take effect 30 days after publication,
                unless applicable law requires a different date. Reading the
                updated Terms does not bring that date forward. Non-material
                changes may be effective immediately without notice.
            </Typography>
            <Typography>
                Your continued use of PlayBingo after updated Terms become
                effective constitutes acceptance of the revised Terms.
            </Typography>
            <Typography>
                We may suspend or terminate access to the Service, including an
                account or game, if we reasonably believe that you have violated
                these Terms, created a security or legal risk, or otherwise
                misused the Service.
            </Typography>
            <Typography>You may stop using PlayBingo at any time.</Typography>
            <Typography>
                PlayBingo does not guarantee that the Service, any account, or
                any User Content will be available indefinitely. We may
                discontinue or substantially modify the Service in the future.
                We do not guarantee indefinite preservation of User Content or
                other data.
            </Typography>
            <Typography>
                Sections that by their nature should survive termination,
                including provisions concerning intellectual property,
                disclaimers, limitations of liability, and dispute-related
                provisions, will survive termination.
            </Typography>
            <Typography variant="h5">10. Disclaimer of Warranties</Typography>
            <Typography>
                To the maximum extent permitted by applicable law, PlayBingo and
                the Service are provided on an &quot;as is&quot; and &quot;as
                available&quot; basis.
            </Typography>
            <Typography>
                PlayBingo makes no warranties that the Service will be
                uninterrupted, error-free, secure, accurate, complete, or
                suitable for any particular purpose.
            </Typography>
            <Typography>
                We do not guarantee that User Content or other data available
                through the Service will be preserved or remain available.
            </Typography>
            <Typography>
                Nothing in these Terms excludes or limits any warranty or right
                that cannot legally be excluded or limited.
            </Typography>
            <Typography variant="h5">11. Limitation of Liability</Typography>
            <Typography>
                To the maximum extent permitted by applicable law, PlayBingo and
                its operators, contributors, and service providers will not be
                liable for indirect, incidental, special, consequential,
                exemplary, or punitive damages, or for loss of data, profits,
                revenue, goodwill, or other intangible losses arising from or
                related to your use of the Service.
            </Typography>
            <Typography>
                Nothing in these Terms excludes or limits liability for death or
                personal injury caused by negligence, fraud or fraudulent
                misrepresentation, or any other liability that cannot lawfully
                be excluded or limited. The exclusions above do not restrict
                your mandatory consumer rights, including any applicable right
                to services provided with reasonable care and skill.
            </Typography>
            <Typography variant="h5">12. Governing Law</Typography>
            <Typography>
                These Terms are governed by the laws of England and Wales. If
                you are a consumer, this choice does not deprive you of
                mandatory protections under the laws of your country of
                residence.
            </Typography>
            <Typography>
                Any dispute arising from these Terms or the Service will be
                subject to the non-exclusive jurisdiction of the courts of
                England and Wales. Consumers may also bring proceedings in their
                local courts where applicable law provides that right.
            </Typography>
            <Typography variant="h5">13. General</Typography>
            <Typography>
                If any provision of these Terms is found to be unenforceable,
                the remaining provisions will remain in effect.
            </Typography>
            <Typography>
                Our failure to enforce a provision of these Terms does not waive
                our right to enforce it later.
            </Typography>
            <Typography>
                These Terms and any other terms expressly incorporated by
                reference constitute the agreement between you and PlayBingo
                concerning your use of the Service.
            </Typography>
            <Typography variant="h5">14. Contact</Typography>
            <Typography>
                Questions regarding these Terms may be sent to:
            </Typography>
            <Typography sx={{ fontWeight: 'bold' }}>
                <Link href="mailto:staff@playbingo.gg">staff@playbingo.gg</Link>
            </Typography>
            <Typography>PlayBingo</Typography>
            <Typography>
                Bingothon C.I.C., registered in England and Wales
            </Typography>
            <Typography>Company number: 13756480</Typography>
        </Container>
    );
}
