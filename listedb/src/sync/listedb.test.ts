import { lSchema, lField, list } from './listedb';
import { createReactive } from './reactive';
import { jest } from '@jest/globals';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  })
) as jest.Mock;

describe('listedb', () => {
  const sTodos = lSchema({
    name: 'todos',
    fields: {
      id: lField.id.autouuid(),
      text: {},
      createdAt: lField.now(),
      updatedAt: lField.updatedAt(),
    },
  });

  it('should create a list and add an item', async () => {
    const todos = await list(sTodos);
    await todos.create({ data: { text: 'Buy milk' } });
    expect(todos().length).toBe(1);
    expect(todos()[0].text).toBe('Buy milk');
  });

  it('should update an item in the list', async () => {
    const todos = await list(sTodos);
    await todos.create({ data: { text: 'Buy milk' } });
    const todo = todos()[0];
    await todos.update({ where: { id: todo.id }, data: { text: 'Buy almond milk' } });
    expect(todos()[0].text).toBe('Buy almond milk');
  });

  it('should delete an item from the list', async () => {
    const todos = await list(sTodos);
    await todos.create({ data: { text: 'Buy milk' } });
    const todo = todos()[0];
    await todos.delete({ where: { id: todo.id } });
    expect(todos().length).toBe(0);
  });

  it('should filter the list', async () => {
    const filters = createReactive({ where: { text: 'Buy milk' } });
    const todos = await list(sTodos, filters);
    await todos.create({ data: { text: 'Buy milk' } });
    await todos.create({ data: { text: 'Buy eggs' } });
    expect(todos().length).toBe(1);
    expect(todos()[0].text).toBe('Buy milk');
  });
});
