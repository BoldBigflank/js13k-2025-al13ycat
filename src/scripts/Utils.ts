export const Clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
};

export const initCanvas = (
    size = 512,
): [HTMLCanvasElement, CanvasRenderingContext2D] => {
    const canvas = document.createElement("canvas") as HTMLCanvasElement;
    canvas.width = size;
    canvas.height = size;
    // document.getElementById("extra")?.appendChild(canvas)
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    return [canvas, ctx];
};

export const comboCorrectCount = (array1: number[], array2: number[], startAtZero: boolean = false): number => {
    let count = 0;
    let array2StartIndex = array2.findIndex(value => value === array1[0]);
    for (let i = 0; i < array1.length && i < array2.length; i++) {
        if (array1[i] === array2[(array2StartIndex + i) % array2.length]) {
            count++;
        } else {
            break;
        }
    }
    return count;
};