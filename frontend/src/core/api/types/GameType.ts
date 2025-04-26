export enum GameType {
  reactionTime = "reactionTime",
  memoryMatrix = "memoryMatrix",
  chimpTest = "chimpTest",
}

export const gameTypes = [
  { id: GameType.reactionTime, name: "Реакция", unit: "мс." },
  { id: GameType.memoryMatrix, name: "Память", unit: "урв." },
  { id: GameType.chimpTest, name: "Тест Шимпанзе", unit: "урв." },
];
