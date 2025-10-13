> Current Date and Time (UTC): 2025-10-13 20:09:33  
> Current User: @GUMRI

# Listed Framework

**Listed Framework** is a frontend listed data management framework that simplifies working with listed data across different frontend frameworks.

ة

## Features

### 1. Simple Schema Definition

```typescript copy
const sFood = lSchema({
  name: "foods",
  fields: {
    id: lField.id.autoincrement(),     // Auto increment ID
    name: lField.index(z.string().max(10)),          // String with validation
    price: z.number().min(0),          // Number with validation
    createdAt: lField.now(),     // Automatic timestamp
    category: lField.fromOne(() => sCategory), // population 
  }
});

// Use the schema
const foods = list(sFood);
```

### 2. Sample CRUD Operations

```typescript copy
const foods = list(sFoods);

// Create
await foods.create({
  data: { name: 'pizza' }
});

// Read
const allFoods = foods() // return reactive list;
const oneFood = foods.findUnique({
  where: { id: 1 }
}) // rective unique item

const oneFood = foods.findfirst({
  where: { name: 'pizza' }
}) // rective first item

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

### 3. Reactive State Management

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

### 4. Easy Reactive Filters

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

### 5. Multiple Storage Options

```typescript copy
// Local Storage
const localFoods = list(sFoods, {
  source: 'indexeddb'  // or 'sqlite'
});

// Remote Storage
const remoteFoods = list(sFoods, {
  source: 'rest',      // or 'graphql', 'firebase', 'supabase'
  endpoint: 'https://api.example.com/foods'
});

// Synced Storage
const syncedFoods = list(sFoods, {
  source: {
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

1. **Simple Schema Definition**
   - Auto-incrementing IDs
   - Built-in field types
   - Zod validation
   - Relationships support

2. **CRUD Operations**
   - Simple and intuitive API
   - Type-safe operations
   - Automatic error handling

3. **Reactive State**
   - Framework-agnostic reactivity
   - Automatic UI updates
   - Built-in loading states

4. **Dynamic Filters**
   - Real-time filtering
   - Complex queries support
   - Sortable and paginated results

5. **Storage Options**
   - Local: IndexedDB, SQLite
   - Remote: REST, GraphQL, Firebase, Supabase
   - Sync: Automatic synchronization

## Notes
- Zero configuration needed
- Framework-specific optimizations
- Automatic state management
- Built-in TypeScript support
- Flexible storage options
- Offline-first capability

---
<sub>Generated with ❤️ by Listed Framework | Last updated: 2025-10-13 20:09:33 UTC</sub>
