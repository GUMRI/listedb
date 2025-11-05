import './style.css';
import { lSchema, lField, list } from 'listedb';

const sPosts = lSchema({
  name: 'posts',
  fields: {
    id: lField.id.autouuid(),
    title: {},
    body: {},
  },
});

async function main() {
  const posts = await list(sPosts, undefined, {
    source: {
      local: 'localStorage',
      remote: 'rest',
    },
    endpoint: 'https://jsonplaceholder.typicode.com/posts',
  });

  const app = document.querySelector<HTMLDivElement>('#app')!;

  app.innerHTML = `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Posts</h1>
      <div id="posts" class="grid gap-4"></div>
      <form id="add-post-form" class="mt-4">
        <input type="text" id="title" class="border p-2 w-full mb-2" placeholder="Title" required />
        <textarea id="body" class="border p-2 w-full mb-2" placeholder="Body" required></textarea>
        <button type="submit" class="bg-blue-500 text-white p-2 rounded">Add Post</button>
      </form>
      <button id="sync-button" class="bg-green-500 text-white p-2 rounded mt-4">Sync</button>
    </div>
  `;

  const postsContainer = document.querySelector<HTMLDivElement>('#posts')!;
  const addPostForm = document.querySelector<HTMLFormElement>('#add-post-form')!;
  const syncButton = document.querySelector<HTMLButtonElement>('#sync-button')!;

  const renderPosts = () => {
    postsContainer.innerHTML = '';
    posts().forEach(post => {
      const postElement = document.createElement('div');
      postElement.classList.add('border', 'p-4', 'rounded');
      postElement.innerHTML = `
        <h2 class="text-xl font-bold">${post.title}</h2>
        <p>${post.body}</p>
      `;
      postsContainer.appendChild(postElement);
    });
  };

  posts.subscribe(renderPosts);

  addPostForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const titleInput = document.querySelector<HTMLInputElement>('#title')!;
    const bodyInput = document.querySelector<HTMLTextAreaElement>('#body')!;
    await posts.create({
      data: {
        title: titleInput.value,
        body: bodyInput.value,
      },
    });
    titleInput.value = '';
    bodyInput.value = '';
  });

  syncButton.addEventListener('click', () => {
    // The sync is automatic, but we can trigger it manually if we want.
    // In this implementation, the sync is triggered on every change.
  });

  renderPosts();
}

main();
