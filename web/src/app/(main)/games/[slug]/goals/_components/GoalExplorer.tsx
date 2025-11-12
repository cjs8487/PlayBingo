'use client';
import { Box, Button, Container } from '@mui/material';
import { PieChart, PieSeries } from '@mui/x-charts';
import { Goal } from '@playbingo/types';
import { useMemo, useState } from 'react';

interface Props {
    goals: Goal[];
}

const middleRadius = 250;

export default function GoalExplorer({ goals }: Props) {
    const [selectedCategory, setSelectedCategory] = useState('');

    let shownGoals: Goal[];
    if (selectedCategory) {
        shownGoals = goals.filter((goal) =>
            goal.categories?.includes(selectedCategory),
        );
    } else {
        shownGoals = goals;
    }

    const categoryCounts = useMemo(
        () =>
            shownGoals.reduce<{ [k: string]: number }>((curr, val) => {
                val.categories?.forEach((cat) => {
                    if (curr[cat]) {
                        curr[cat] += 1;
                    } else {
                        curr[cat] = 1;
                    }
                });
                return curr;
            }, {}),
        [shownGoals],
    );

    const categories = Object.keys(categoryCounts);

    const difficultyByCategory = useMemo(() => {
        return categories.flatMap((cat) => {
            const matchedGoals = shownGoals.filter((g) =>
                g.categories?.includes(cat),
            );
            const byDiff = matchedGoals.reduce<{ [k: number]: number }>(
                (curr, goal) => {
                    if (goal.difficulty) {
                        if (curr[goal.difficulty]) {
                            curr[goal.difficulty] += 1;
                        } else {
                            curr[goal.difficulty] = 1;
                        }
                    }
                    return curr;
                },
                {},
            );
            return Object.keys(byDiff).map((diff) => ({
                label: diff,
                value: byDiff[diff as unknown as number],
            }));
        });
    }, [shownGoals, categories]);

    const series: PieSeries[] = [];
    if (!selectedCategory) {
        series.push({
            data: categories.map((cat) => ({
                label: cat,
                value: categoryCounts[cat],
            })),
            highlightScope: {
                highlight: 'item',
                fade: 'global',
            },
            outerRadius: middleRadius,
            arcLabel: 'label',
            arcLabelMinAngle: 25,
        });
    }
    series.push({
        data: difficultyByCategory,
        innerRadius: !selectedCategory ? middleRadius : undefined,
        outerRadius: !selectedCategory ? middleRadius + 50 : undefined,
        arcLabel: selectedCategory ? 'label' : undefined,
        arcLabelMinAngle: 5,
    });

    return (
        <Container
            sx={{
                width: '100%',
                height: '100%',
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {selectedCategory}{' '}
                <Button onClick={() => setSelectedCategory('')}>Clear</Button>
            </Box>
            <Box sx={{ width: '100%', height: '100%' }}>
                <PieChart
                    series={series}
                    onItemClick={(event, itemId, item) => {
                        if (typeof item.label === 'string') {
                            setSelectedCategory(item.label);
                        }
                    }}
                    slotProps={{
                        legend: {
                            sx: {
                                overflowY: 'scroll',
                                flexWrap: 'nowrap',
                                height: '600px',
                            },
                        },
                    }}
                    width={600}
                    height={600}
                />
            </Box>
        </Container>
    );
}
