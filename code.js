let transactions = [];
let isIncome = true;
let budgetLimit = 0;

const categoryDropdown = document.getElementById('categoryDropdown');
const removeCategoryDropdown = document.getElementById('removeCategoryDropdown');
const budgetCategoryDropdown = document.getElementById('categoryDropdownBudget');

// Actualizar la visualización del presupuesto
function updateBudgetDisplay() {
  const sessionUser = localStorage.getItem('session');
  const budgets = JSON.parse(localStorage.getItem(`budgets_${sessionUser}`)) || {};
  const remainingBudgetElement = document.getElementById('remaining-budget');
  const categoryLimitsContainer = document.getElementById('category-limits');

  categoryLimitsContainer.innerHTML = ''; // Limpiar visualización

  let totalBudget = 0;
  for (const category in budgets) {
    const limit = budgets[category];
    totalBudget += limit;

    const limitDisplay = document.createElement('p');
    limitDisplay.textContent = `Límite para ${category}: $${limit.toFixed(2)}`;
    categoryLimitsContainer.appendChild(limitDisplay);
  }

  remainingBudgetElement.textContent = totalBudget.toFixed(2);
}


// Calcular los gastos totales por categoría
function getExpensesByCategory() {
  const expensesByCategory = {};

  transactions.forEach(transaction => {
    if (transaction.amount < 0) { // Solo considerar gastos
      const category = transaction.category;
      const amount = Math.abs(transaction.amount); // Convertir a positivo
      
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0;
      }
      expensesByCategory[category] += amount;
    }
  });

  return expensesByCategory;
}


// Agregar una categoría nueva y sincronizar los menús
function addCategory() {
  const newCategoryInput = document.getElementById("newCategory");
  const newCategory = newCategoryInput.value.trim();

  if (newCategory) {
    const option = document.createElement('option');
    option.value = newCategory;
    option.textContent = newCategory;

    categoryDropdown.appendChild(option);
    syncCategoryDropdowns();
    newCategoryInput.value = ""; // Limpiar el input
  } else {
    alert("Por favor, ingrese una categoría válida.");
  }
}

// Establecer límite de presupuesto
function setBudget() {
  const sessionUser = localStorage.getItem('session');
  const category = budgetCategoryDropdown.value;
  const budgetAmount = parseFloat(document.getElementById('budgetAmount').value) || 0;

  if (!sessionUser) {
    alert('Por favor, inicia sesión primero.');
    return;
  }

  const budgets = JSON.parse(localStorage.getItem(`budgets_${sessionUser}`)) || {};
  budgets[category] = budgetAmount;

  localStorage.setItem(`budgets_${sessionUser}`, JSON.stringify(budgets));
  alert('Límite de presupuesto establecido.');
  updateBudgetDisplay();
}

// Agregar una nueva transacción
// Agregar una nueva transacción y verificar si se excede el límite
function addTransaction() {
  const description = document.getElementById("description").value;
  const dateInput = document.getElementById("date").value;
  const amount = parseFloat(document.getElementById("amount").value) * (isIncome ? 1 : -1);
  const category = categoryDropdown.value;

  if (description && dateInput && !isNaN(amount) && category) {
    const [year, month, day] = dateInput.split('-');
    const date = new Date(year, month - 1, day);

    const transaction = { 
      description, 
      date: date.toISOString().split('T')[0], 
      amount, 
      category 
    };

    // Guardar la transacción en localStorage
    const sessionUser = localStorage.getItem('session');
    const storedTransactions = JSON.parse(localStorage.getItem(`transactions_${sessionUser}`)) || [];
    storedTransactions.push(transaction);
    localStorage.setItem(`transactions_${sessionUser}`, JSON.stringify(storedTransactions));

    // Actualizar las transacciones en memoria y mostrar la lista
    transactions.push(transaction);
    displayTransactions(transactions);
    calculateTotals(transactions);
    updateBudgetDisplay();
    updateChart(transactions);

    // Verificar si se ha excedido el límite en la categoría
    checkCategoryLimitExceeded(category);

  } else {
    alert("Por favor, complete todos los campos requeridos.");
  }
}

// Verificar si se ha excedido el límite en una categoría
function checkCategoryLimitExceeded(category) {
  const sessionUser = localStorage.getItem('session');
  const budgets = JSON.parse(localStorage.getItem(`budgets_${sessionUser}`)) || {};
  const limit = budgets[category] || 0;

  // Calcular los gastos totales de la categoría
  const totalExpenses = transactions
    .filter(tx => tx.category === category && tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Si los gastos exceden el límite, mostrar alerta
  if (totalExpenses > limit) {
    const excess = totalExpenses - limit;
    alert(`¡Se ha excedido el límite en la categoría "${category}"!
      \nGastos totales: $${totalExpenses.toFixed(2)}
      \nLímite establecido: $${limit.toFixed(2)}
      \nExceso: $${excess.toFixed(2)}`);
  }
}


// Sincronizar categorías entre los menús
function syncCategoryDropdowns() {
  const allCategories = Array.from(categoryDropdown.options);
  removeCategoryDropdown.innerHTML = "";
  budgetCategoryDropdown.innerHTML = "";

  allCategories.forEach(option => {
    const removeOption = option.cloneNode(true);
    const budgetOption = option.cloneNode(true);
    removeCategoryDropdown.appendChild(removeOption);
    budgetCategoryDropdown.appendChild(budgetOption);
  });
}

// Confirmar y eliminar categoría
function confirmRemoveCategory() {
  const selectedCategory = removeCategoryDropdown.value;

  if (selectedCategory && confirm(`¿Estás seguro de que quieres eliminar la categoría "${selectedCategory}"?`)) {
    removeCategory(selectedCategory);
  }
}

// Eliminar una categoría de los menús desplegables
function removeCategory(category) {
  [categoryDropdown, removeCategoryDropdown, budgetCategoryDropdown].forEach(dropdown => {
    Array.from(dropdown.options).forEach(option => {
      if (option.value === category) dropdown.removeChild(option);
    });
  });
}

// Alternar entre ingresos y gastos
function toggleTransactionType() {
  isIncome = !isIncome;
  document.getElementById("toggleTypeButton").textContent = isIncome ? 'Ingresos' : 'Gastos';
}

// Obtener el total de gastos
function getTotalExpense() {
  return transactions.reduce((total, transaction) => {
    return total + (transaction.amount < 0 ? -transaction.amount : 0);
  }, 0);
}

function updateTransactionList() {
  const sessionUser = localStorage.getItem('session');
  const transactions = JSON.parse(localStorage.getItem(`transactions_${sessionUser}`)) || [];
  const transactionList = document.getElementById('transaction-list');
  transactionList.innerHTML = '';

  const budgets = JSON.parse(localStorage.getItem(`budgets_${sessionUser}`)) || {};

  transactions.forEach((transaction) => {
    const listItem = document.createElement('li');
    const limit = budgets[transaction.category] || 0; // Obtener el límite de la categoría
    listItem.textContent = `${transaction.description} - $${transaction.amount} (${transaction.date}, ${transaction.category}) - Límite: $${limit.toFixed(2)}`;
    transactionList.appendChild(listItem);
  });
}

// Calcular los totales de ingresos y gastos
function calculateTotals(transactionsToCalculate) {
  let totalIncome = 0;
  let totalExpense = 0;

  transactionsToCalculate.forEach(transaction => {
    if (transaction.amount > 0) totalIncome += transaction.amount;
    else totalExpense += Math.abs(transaction.amount);
  });

  const remainingBudget = totalIncome - totalExpense;

  document.getElementById("total-income").textContent = totalIncome.toFixed(2);
  document.getElementById("total-expense").textContent = totalExpense.toFixed(2);

  // Actualizar solo si se ha establecido un límite
  if (budgetLimit > 0) {
    document.getElementById("remaining-budget").textContent = (budgetLimit - totalExpense).toFixed(2);
  }

  // Actualizar el nuevo label del presupuesto en el historial
  document.getElementById("budget-history").textContent = remainingBudget.toFixed(2);

  return { totalIncome, totalExpense, remainingBudget };
}



// Filtrar transacciones por fecha
function filterTransactions() {
  const startDate = new Date(document.getElementById("start-date").value);
  const endDate = new Date(document.getElementById("end-date").value);

  if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
    alert("Por favor, ingrese un rango de fechas válido.");
    return;
  }

  // Filtrar las transacciones dentro del rango de fechas
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });

  // Mostrar las transacciones filtradas en la lista
  displayTransactions(filteredTransactions);

  // Calcular y mostrar los totales
  calculateTotals(filteredTransactions);

  // Actualizar la gráfica con las transacciones filtradas
  updateChart(filteredTransactions);
}


// Configurar la gráfica
const ctx = document.getElementById('incomeChart').getContext('2d');
const incomeChart = new Chart(ctx, {
  type: 'pie',
  data: {
    labels: [],
    datasets: [{
      label: 'Porcentaje de Ingresos/Gastos',
      data: [],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
    }]
  }
});


// Actualizar la gráfica con nuevas transacciones
function updateChart(transactionsToChart) {
  const categories = [];
  const amounts = [];

  transactionsToChart.forEach(transaction => {
    const index = categories.indexOf(transaction.category);
    if (index === -1) {
      categories.push(transaction.category);
      amounts.push(transaction.amount);
    } else {
      amounts[index] += transaction.amount;
    }
  });

  incomeChart.data.labels = categories;
  incomeChart.data.datasets[0].data = amounts.map(amount => Math.abs(amount));

  incomeChart.options.plugins.tooltip.callbacks = {
    label: function (tooltipItem) {
      const category = tooltipItem.label;
      const rawValue = amounts[tooltipItem.dataIndex];
      const sign = rawValue < 0 ? '-' : '';
      return `${category}: ${sign}$${Math.abs(rawValue).toFixed(2)}`;
    }
  };

  incomeChart.update();
}

window.onload = function () {
  syncCategoryDropdowns();
  updateBudgetDisplay();
};

//Historial de transacciones diseño
function displayTransactions(transactions) {
  const transactionList = document.getElementById("transaction-list");
  transactionList.innerHTML = "";

  transactions.forEach(transaction => {
    const listItem = document.createElement("li");
    listItem.className = "transaction-card";

    const formattedDate = new Date(transaction.date + 'T00:00:00').toLocaleDateString();

    listItem.innerHTML = `
      <div class="transaction-details">
        <span class="transaction-description">${transaction.description}</span>
        <span class="transaction-date">${formattedDate}</span>
        <span class="transaction-amount" style="color: ${transaction.amount < 0 ? 'red' : 'green'};">
          $${transaction.amount.toFixed(2)}
        </span>
      </div>
    `;

    transactionList.appendChild(listItem);
  });
}



// Inicializar la aplicación al cargar la página
window.onload = function () {
  syncCategoryDropdowns();
  updateBudgetDisplay();
};

// Obtener el historial de transacciones desde localStorage
function getTransactionData() {
  const sessionUser = localStorage.getItem('session');
  return JSON.parse(localStorage.getItem(`transactions_${sessionUser}`)) || [];
}

// Generar y descargar CSV
function generateCSV(transactions) {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Descripción,Fecha,Categoría,Monto\n"; // Encabezados

  transactions.forEach(tx => {
    const row = `${tx.description},${tx.date},${tx.category},${tx.amount}`;
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "historial_transacciones.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generar y descargar PDF usando jsPDF
function generatePDF(transactions) {
  const { jsPDF } = window.jspdf; // Asegúrate de tener jsPDF cargado en tu proyecto
  const doc = new jsPDF();

  doc.text("Historial de Transacciones", 10, 10); // Título del documento

  let y = 20; // Posición vertical inicial
  transactions.forEach(tx => {
    const line = `${tx.date} - ${tx.description} - ${tx.category} - $${tx.amount.toFixed(2)}`;
    doc.text(line, 10, y);
    y += 10; // Incrementar posición vertical para la siguiente línea
  });

  doc.save("historial_transacciones.pdf");
}

// Función para manejar la exportación según el formato seleccionado
function exportTransactions() {
  const transactions = getTransactionData();
  const format = document.getElementById("exportFormat").value;

  if (transactions.length === 0) {
    alert("No hay transacciones para exportar.");
    return;
  }

  if (format === "csv") {
    generateCSV(transactions);
  } else if (format === "pdf") {
    generatePDF(transactions);
  }
}

// Agregar evento al botón de exportación
document.getElementById("exportButton").addEventListener("click", exportTransactions);
