type GoalObject = {
    name: string;
    types: string[];
};
/**
 * Parses an SRLv5 bingo list
 * @param input
 * @returns
 */
export const parseSRLv5BingoList = (input: string): GoalObject[][] | false => {
    const wrappedInput = `
        return (function() {
            let bingoList = [];
            ${input}
            return bingoList;
        })();
        `;

    const func = new Function(wrappedInput);
    try {
        return func();
    } catch {
        //TODO: do something with this error
        return false;
    }
};
