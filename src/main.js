import './styles.css';

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="shell">
    <header class="page-header">
      <div>
        <p class="eyebrow">COS30043 Lab 10</p>
        <h1>Travel Destinations</h1>
      </div>
    </header>
    <section class="toolbar" aria-label="Destination actions">
      <button class="primary" type="button" id="newDestination">Add destination</button>
    </section>
    <section class="panel">
      <p>Loading destinations...</p>
    </section>
  </main>
`;
