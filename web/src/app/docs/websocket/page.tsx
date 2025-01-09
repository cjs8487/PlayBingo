import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

async function getMarkdown() {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_PATH}/api/docs/websocket.md`,
    );
    return res.text();
}

export default async function WebsocketDocs() {
    const markdown = await getMarkdown();
    console.log(markdown);
    return (
        <Box px={4}>
            <ReactMarkdown
                components={{
                    code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                            <SyntaxHighlighter
                                children={String(children).replace(/\n$/, '')}
                                //@ts-ignore for some reason ts doesn't like
                                //this line
                                style={a11yDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                            />
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {markdown}
            </ReactMarkdown>
        </Box>
    );
}
