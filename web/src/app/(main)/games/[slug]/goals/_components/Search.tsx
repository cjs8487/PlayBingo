import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import {
    Autocomplete,
    Box,
    Checkbox,
    FormControl,
    IconButton,
    InputLabel,
    ListItemText,
    MenuItem,
    Select,
    TextField,
    Tooltip,
} from '@mui/material';
import {
    SortOptions,
    useGoalManagerContext,
} from '../../../../../../context/GoalManagerContext';

const sortOptions = [
    { label: 'Default', value: SortOptions.DEFAULT },
    { label: 'Name', value: SortOptions.NAME },
    { label: 'Difficulty', value: SortOptions.DIFFICULTY },
];

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function GoalSearch() {
    const {
        catList,
        searchParams: { sort, reverse },
        setShownCats,
        setSort,
        setReverse,
        setSearch,
    } = useGoalManagerContext();
    return (
        <>
            <Box
                sx={{
                    flexGrow: 1,
                }}
            >
                <Autocomplete
                    multiple
                    id="filter-categories"
                    options={catList}
                    onChange={(_, newValue) => {
                        setShownCats(newValue);
                    }}
                    disableCloseOnSelect
                    renderOption={(props, option, { selected }) => {
                        const { key, ...optionProps } = props;
                        return (
                            <MenuItem key={key} {...optionProps}>
                                <Checkbox
                                    icon={icon}
                                    checkedIcon={checkedIcon}
                                    style={{ marginRight: 8 }}
                                    checked={selected}
                                />
                                <ListItemText>{option}</ListItemText>
                            </MenuItem>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Categories" />
                    )}
                    fullWidth
                />
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    flexGrow: 1,
                    alignItems: 'center',
                    columnGap: 1,
                }}
            >
                <FormControl fullWidth>
                    <InputLabel id="filter-sort-by-label">Sort by</InputLabel>
                    <Select
                        id="filter-sort-by"
                        labelId="filter-sort-by-label"
                        value={sort}
                        onChange={(e) => {
                            setSort(e.target.value as SortOptions);
                        }}
                        label="Sort by"
                    >
                        {sortOptions.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Tooltip title="Toggle sort direction">
                    <IconButton onClick={() => setReverse((curr) => !curr)}>
                        {reverse ? <ArrowUpward /> : <ArrowDownward />}
                    </IconButton>
                </Tooltip>
            </Box>
            <TextField
                type="text"
                label="Search"
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flexGrow: 1 }}
            />
        </>
    );
}
