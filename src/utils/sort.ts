export function sort(array: (number | string)[]): (number | string)[] {
    let arr: (number | string)[] = array.slice()

    arr = arr.map((value) => {
        if (isNaN(+value)) return String(value)
        
        return Number(value)
    })

    arr.sort((a, b) => {
        if (typeof a === 'string' && typeof b === 'number') return 1
        if (typeof a === 'number' && typeof b === 'string') return -1

        if (a < b) return -1
        if (a > b) return 1

        return 0
    })

    return arr
}
