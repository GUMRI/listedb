> Current Date and Time (UTC): 2025-10-13 17:39:05  
> Current User: @GUMRI

# Listed Framework

**Listed Framework** is a frontend data management framework that simplifies working with listed data across different frontend frameworks.

 
## Features

### 1. Sample CRUD Operations

```typescript copy
const foods = list(sFoods);

// Create
await foods.create({
  data: { name: 'pizza' }
});

// Read
const allFoods = foods();
const oneFood = await foods.findUnique({
  where: { id: 1 }
});

// Update
await foods.update({
  where: { id: 1 },
  data: { name: 'pizza 🍕' }
});

// Delete
await foods.delete({
  where: { id: 1 }
});
```

### 2. Reactive State Management

Works seamlessly across Angular, Vue, React, and Vanilla JS:

```typescript copy
// Angular (Signal-based)
@Component({
  template: `
    <ul>
      @for(item of foods(); track item.id) {
        <li>{{ item.name }}</li>
      }
    </ul>
  `
})
class FoodComponent {
  foods = list(sFoods);
}

// Vue (Ref-based)
const foods = list(sFoods);
// <li v-for="item in foods()" :key="item.id">

// React (Hook-based)
const { foods } = list(sFoods);
// {foods().map(item => <li key={item.id}>)}
```

### 3. Easy Reactive Filters

```typescript copy
// Define filters
const filters = signal<LFilterInput>({});
const foods = list(sFoods, filters);

// Update filters reactively
filters.update(v => ({
  where: {
    price: {
      gte: 10,
      lte: 20
    },
    category: 'pizza'
  },
  orderBy: {
    createdAt: 'desc'
  }
}));
```

### 4. Dynamic Field Data

```typescript copy
const sFood = lSchema({
  name: "foods",
  fields: {
    id: lField.id.autoincrement(),
    name: z.string().max(10),
    createdAt: lField.createdAt(),
    updatedAt: lField.updatedAt(),
    category: lField.fromOne(() => sCategory),
    ingredients: lField.fromMany(() => sIngredient)
  }
});
```

### 5. Schema Definition with Zod

```typescript copy
const sFood = lSchema({
  name: "foods",
  fields: {
    name: z.string().min(3).max(50),
    price: z.number().min(0),
    description: z.string().optional(),
    isVegetarian: z.boolean().default(false),
    tags: z.array(z.string())
  }
});
```

### 6. Multiple Storage Options

```typescript copy
// Local Storage
const localFoods = list(sFoods, {
  storage: 'indexeddb'  // or 'sqlite'
});

// Remote Storage
const remoteFoods = list(sFoods, {
  storage: 'rest',      // or 'graphql', 'firebase', 'supabase'
  endpoint: 'https://api.example.com/foods'
});

// Synced Storage
const syncedFoods = list(sFoods, {
  storage: {
    local: 'indexeddb',
    remote: 'rest',
    sync: {
      auto: true,
      interval: 5000  // sync every 5 seconds
    }
  }
});
```

## Key Features Summary

1. **CRUD Operations**
   - Simple and intuitive API
   - Type-safe operations
   - Automatic error handling

2. **Reactive State**
   - Framework-agnostic reactivity
   - Automatic UI updates
   - Built-in loading states

3. **Dynamic Filters**
   - Real-time filtering
   - Complex queries support
   - Sortable and paginated results

4. **Dynamic Fields**
   - Auto-incrementing IDs
   - Timestamps (createdAt, updatedAt)
   - Relationships (one-to-one, one-to-many)
   - Custom field types

5. **TypeScript & Zod Integration**
   - Full type safety
   - Runtime validation
   - Auto-completion support

6. **Storage Options**
   - Local: IndexedDB, SQLite
   - Remote: REST, GraphQL, Firebase, Supabase
   - Sync: Automatic synchronization between local and remote

## Notes
- Zero configuration needed
- Framework-specific optimizations
- Automatic state management
- Built-in TypeScript support
- Flexible storage options
- Offline-first capability

---
<sub>Generated with ❤️ by Listed Framework | Last updated: 2025-10-13 17:39:05 UTC</sub>
