# Listed Framework

> Last updated: 2025-10-13 16:50:59 UTC by @GUMRI

**Listed Framework** provides unified state management across Angular, Vue, and React with a consistent reactive API.

## Reactive State Management

Listed Framework handles all state management needs with a unified API that adapts to each framework's paradigm:

### Common Pattern Across Frameworks

```typescript copy
const foods = list(sFoods);

// Reactive Data
foods()        // Returns reactive list
foods.loading() // Returns reactive loading state
foods.error()   // Returns reactive error state
```

### Angular Example

```typescript copy
@Component({
  selector: 'app-foods',
  standalone: true,
  template: `
    <!-- Reactive List -->
    <ul>
      @for(item of foods(); track item.id) {
        <li>{{ item.name }}</li>
      }
    </ul>

    <!-- Reactive Loading -->
    @if (foods.loading()) {
      <div>Loading...</div>
    }

    <!-- Reactive Error -->
    @if (foods.error()) {
      <div>Error: {{ foods.error() }}</div>
    }
  `
})
export class Foods {
  foods = list(sFoods);  // Signal-based reactivity
}
```

### Vue Example

```vue copy
<script setup lang="ts">
const foods = list(sFoods)  // Ref-based reactivity
</script>

<template>
  <!-- Reactive List -->
  <ul>
    <li v-for="item in foods()" :key="item.id">
      {{ item.name }}
    </li>
  </ul>

  <!-- Reactive Loading -->
  <div v-if="foods.loading()">Loading...</div>

  <!-- Reactive Error -->
  <div v-if="foods.error()">
    Error: {{ foods.error() }}
  </div>
</template>
```

### React Example

```tsx copy
function FoodList() {
  const foods = list(sFoods);  // Hook-based reactivity

  return (
    <>
      {/* Reactive List */}
      <ul>
        {foods().map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>

      {/* Reactive Loading */}
      {foods.loading() && <div>Loading...</div>}

      {/* Reactive Error */}
      {foods.error() && (
        <div>Error: {foods.error()}</div>
      )}
    </>
  );
}
```

## Key Features

### 1. Unified Reactive API
```typescript copy
// Works the same in all frameworks
const foods = list(sFoods);

// Reactive Data
foods()                // Get current data
foods.loading()        // Get loading state
foods.error()          // Get error state

// Mutations
await foods.create({ data: { name: 'Pizza' } })
await foods.update({ where: { id: 1 }, data: { name: 'Super Pizza' } })
await foods.delete({ where: { id: 1 } })
```

### 2. Framework-Specific Integration
- **Angular**: Integrates with Signals
- **Vue**: Works with Ref system
- **React**: Compatible with Hooks

### 3. Automatic State Updates
```typescript copy
// State updates automatically in all frameworks
foods.create({ data: { name: 'Pizza' } })
// UI updates automatically without manual intervention
```

### 4. Built-in Loading & Error States
```typescript copy
// Automatic loading states
foods.loading() // true during operations

// Automatic error handling
foods.error() // catches and exposes errors
```

## Notes
- No need for external state management libraries
- Framework-specific optimizations built-in
- Consistent API across all frameworks
- Automatic reactivity handling
- Built-in TypeScript support
- Zero configuration needed

---
<sub>Generated with ❤️ by Listed Framework | Last updated: 2025-10-13 16:50:59 UTC</sub>
