
const condition = {
  like: 'LIKE',
  eq: '==',
  notEq: '!=',
}
Object.freeze(condition);

const sections = {
  'Guide to Middle-earth': 1,
  'Playing the Game': 2,
  'Battle Game': 3,
  'Painting Workshop': 4,
  'Modelling Workshop': 5,
}

module.exports = { condition, sections };