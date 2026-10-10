const people = [
  { id: 1, name: 'Ana Torres' },
  { id: 2, name: 'Luis Perez' },
  { id: 3, name: 'Anabel Ruiz' },
];
exports.list = () => people.map((person) => ({ ...person }));
exports.byId = (id) => exports.list().find((person) => person.id === id);
exports.search = (query) => exports.list().filter((person) => String(person.id).includes(query.trim()));
