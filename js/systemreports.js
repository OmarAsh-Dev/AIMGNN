// Register Chart.js DataLabels plugin
Chart.register(ChartDataLabels);

let currentChart = null;
let currentData = null;

document.addEventListener('DOMContentLoaded', function () {
  updateDateTime();
  setInterval(updateDateTime, 1000);
  setupEventListeners();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
  document.getElementById('endDate').value = today;
  loadQueries();
});

function setupEventListeners() {
  document.getElementById('reportType').addEventListener('change', updateReport);
  document.getElementById('startDate').addEventListener('change', handleDateChange);
  document.getElementById('endDate').addEventListener('change', handleDateChange);
  document.getElementById('datePresets').addEventListener('change', handleDatePreset);

  const crudRadios = document.getElementsByName('crudOperation');
  crudRadios.forEach(radio => radio.addEventListener('change', handleCrudOperationChange));

  const customDropdownBtn = document.getElementById('customDropdownBtn');
  const customDropdownContent = document.getElementById('customDropdownContent');
  customDropdownBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    customDropdownContent.style.display = customDropdownContent.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('click', function(e) {
    if (!customDropdownContent.contains(e.target))
      customDropdownContent.style.display = 'none';
  });

  const simpleQueriesIcon = document.getElementById('simpleQueriesIcon');
  const simpleQueries = document.getElementById('simpleQueries');
  simpleQueriesIcon.addEventListener('click', function(e) {
    e.stopPropagation();
    simpleQueries.style.display = simpleQueries.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('click', function(e) {
    if (!simpleQueries.contains(e.target) && e.target !== simpleQueriesIcon)
      simpleQueries.style.display = 'none';
  });

  document.querySelectorAll('#simpleQueries li').forEach(item => {
    item.addEventListener('click', function() {
      document.getElementById('queryInput').value = this.getAttribute('data-query');
      simpleQueries.style.display = 'none';
    });
  });

  let lastScrollTop = 0;
  window.addEventListener("scroll", function() {
    let st = window.pageYOffset || document.documentElement.scrollTop;
    const navbar = document.querySelector('.navbar');
    if (st > lastScrollTop) navbar.classList.add("hidden");
    else navbar.classList.remove("hidden");
    lastScrollTop = st <= 0 ? 0 : st;
  });
}

async function loadQueries() {
  try {
    const response = await fetch('https://8080-01jrr2n0pracv1ekcjdzfy007x.cloudspaces.litng.ai/queries');
    if (!response.ok) throw new Error(await response.text());
    const result = await response.json();
    const queries = result.queries;

    const groups = {};
    queries.forEach(query => {
      const group = query.category || "Others";
      if (!groups[group]) groups[group] = [];
      groups[group].push(query);
    });

    const groupOrder = [
      "Composer Reports",
      "Audio Engineer Reports",
      "Programmer Reports",
      "Admin Reports",
      "Time-based and Trends Reports",
      "Combined/Network Reports",
      "Others"
    ];

    const container = document.getElementById('customDropdownContent');
    container.innerHTML = '';

    groupOrder.forEach(group => {
      if (groups[group]) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'dropdown-group';

        const groupTitle = document.createElement('div');
        groupTitle.className = 'group-title';
        groupTitle.textContent = group;
        groupDiv.appendChild(groupTitle);

        const ul = document.createElement('ul');
        groups[group].forEach(query => {
          const li = document.createElement('li');
          li.setAttribute('data-query-id', query.system_query_id);
          li.textContent = `${query.system_query_id}. ${query.name}`;
          li.addEventListener('click', function() {
            const queryId = this.getAttribute('data-query-id');
            const customDropdownBtn = document.getElementById('customDropdownBtn');
            customDropdownBtn.textContent = this.textContent;
            customDropdownBtn.setAttribute('data-selected-query', queryId);
            document.getElementById('reportTitle').textContent = query.name;
            container.style.display = 'none';
            fetchReportData(queryId);
          });
          ul.appendChild(li);
        });
        groupDiv.appendChild(ul);
        container.appendChild(groupDiv);
      }
    });
  } catch (error) {
    console.error('Error loading queries:', error);
    alert('Failed to load queries: ' + error.message);
  }
}

function handleDatePreset() {
  const preset = document.getElementById('datePresets').value;
  let startDate, endDate;
  const today = new Date();
  switch(preset) {
    case 'today': startDate = endDate = today; break;
    case 'week':
      const day = today.getDay();
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      startDate = new Date(today);
      startDate.setDate(today.getDate() + diffToMonday);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'quarter':
      const quarter = Math.floor(today.getMonth() / 3);
      startDate = new Date(today.getFullYear(), quarter * 3, 1);
      endDate = new Date(today.getFullYear(), quarter * 3 + 3, 0);
      break;
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
      break;
    default: return;
  }
  function formatDate(date) {
    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    const year = date.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }
  document.getElementById('startDate').value = formatDate(startDate);
  document.getElementById('endDate').value = formatDate(endDate);
  handleDateChange();
}

function handleCrudOperationChange() {
  const operation = document.querySelector('input[name="crudOperation"]:checked').value;
  const submitBtn = document.querySelector('.submit-btn');
  document.getElementById('fieldQueryId').style.display = 'none';
  document.getElementById('fieldQueryName').style.display = 'none';
  document.getElementById('fieldQueryText').style.display = 'none';
  document.getElementById('fieldQueryCategory').style.display = 'none';
  document.getElementById('labelUpdateQueryId').style.display = 'none';
  document.getElementById('updateQueryId').style.display = 'none';
  document.getElementById('labelDeleteQueryId').style.display = 'none';
  document.getElementById('deleteQueryId').style.display = 'none';
  document.getElementById('addQueryName').style.display = 'none';
  document.getElementById('updateQueryName').style.display = 'none';
  document.getElementById('addQueryText').style.display = 'none';
  document.getElementById('updateQueryText').style.display = 'none';

  if (operation === 'delete') {
    document.getElementById('fieldQueryId').style.display = 'block';
    document.getElementById('labelDeleteQueryId').style.display = 'block';
    document.getElementById('deleteQueryId').style.display = 'block';
    submitBtn.style.marginTop = '20px';
  } else if (operation === 'update') {
    document.getElementById('fieldQueryId').style.display = 'block';
    document.getElementById('labelUpdateQueryId').style.display = 'block';
    document.getElementById('updateQueryId').style.display = 'block';
    document.getElementById('fieldQueryName').style.display = 'block';
    document.getElementById('updateQueryName').style.display = 'block';
    document.getElementById('fieldQueryText').style.display = 'block';
    document.getElementById('updateQueryText').style.display = 'block';
    submitBtn.style.marginTop = '10px';
  } else { // add
    document.getElementById('fieldQueryName').style.display = 'block';
    document.getElementById('addQueryName').style.display = 'block';
    document.getElementById('fieldQueryText').style.display = 'block';
    document.getElementById('addQueryText').style.display = 'block';
    document.getElementById('fieldQueryCategory').style.display = 'block';
    submitBtn.style.marginTop = '10px';
  }
}

function updateDateTime() {
  const now = new Date();
  document.getElementById('reportGenerated').textContent = 'Report Generated: ' + now.toLocaleString();
}

async function handleDateChange() {
  const selectedQuery = document.getElementById('customDropdownBtn').getAttribute('data-selected-query') || "";
  if (selectedQuery) await fetchReportData(selectedQuery);
}

async function generateReport() {
  const customQuery = document.getElementById('queryInput').value.trim();
  const queryId = customQuery ? "custom" : document.getElementById('customDropdownBtn').getAttribute('data-selected-query');
  if (!queryId) {
    alert('Please select or enter a query.');
    return;
  }
  await fetchReportData(queryId);
}

async function fetchReportData(queryId) {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const customQuery = document.getElementById('queryInput').value.trim();
  const reportType = document.getElementById('reportType').value;

  if (!startDate || !endDate) {
    alert('Please select a start and end date.');
    return;
  }

  const queryType = customQuery ? "custom" : Number(queryId);
  const payload = {
    query_type: queryType,
    custom_query: customQuery,
    report_type: reportType,
    start_date: `${startDate}T00:00:00`,
    end_date: `${endDate}T23:59:59`,
    filters: {}
  };

  try {
    const response = await fetch('https://8080-01jrr2n0pracv1ekcjdzfy007x.cloudspaces.litng.ai/generate-report', {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    currentData = data.data;
    updateReport();
  } catch (error) {
    console.error('Error fetching data:', error);
    alert('Failed to fetch report data: ' + error.message);
  }
}

function prepareChartData(data, chartType) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const reportTitle = document.getElementById('reportTitle').textContent.trim();
  const importantColumnsMapping = {
    "Comprehensive Composer Productivity": { bar: ["music_piece_count", "feedback_count"], pie: "music_piece_count" },
    "Composer Feedback Engagement": { bar: ["feedback_count", "music_pieces"], pie: "feedback_count" },
    "Composer Collaboration Network": { bar: ["total_music_pieces", "total_feedback"], pie: "total_music_pieces" },
    "Inactive Composers Analysis": { bar: [], pie: null },
    "Music Piece Version Statistics": { bar: ["version_count"], pie: null },
    "Composer Music Piece Engagement": { bar: ["music_piece_count", "audio_engineers_involved"], pie: "music_piece_count" },
    "Composer Feedback Patterns": { bar: ["feedback_count", "mixing_feedback"], pie: "feedback_count" },
    "Audio Engineer Workload and Collaborations": { bar: ["music_pieces_worked", "composer_collabs"], pie: "music_pieces_worked" },
    "Audio Engineer Activity Timeline": { bar: ["total_pieces", "composers_worked_with"], pie: "total_pieces" },
    "Audio Engineer Collaboration Depth": { bar: ["total_pieces", "total_composers"], pie: "total_pieces" },
    "Audio Engineers Without Assignments": { bar: [], pie: null },
    "Audio Engineer Version Contributions": { bar: ["music_pieces", "version_contributions"], pie: "version_contributions" },
    "Audio Engineer Music Piece Overlap": { bar: ["music_pieces", "composers"], pie: "music_pieces" },
    "Audio Engineer Collaboration Efficiency": { bar: ["music_pieces", "pieces_per_composer"], pie: "music_pieces" },
    "Programmer Workload and Impact": { bar: ["music_pieces_assigned", "composers_involved"], pie: "music_pieces_assigned" },
    "Programmer Collaboration Network": { bar: ["music_pieces", "composer_collabs"], pie: "music_pieces" },
    "Programmer Activity Timeline": { bar: ["total_assignments", "composers_worked_with"], pie: "total_assignments" },
    "Programmer Music Piece Contribution": { bar: ["music_pieces", "composers"], pie: "music_pieces" },
    "Programmer Collaboration Overlap": { bar: ["shared_music_pieces", "composer_collabs"], pie: "shared_music_pieces" },
    "Programmer Work Efficiency": { bar: ["music_pieces", "pieces_per_composer"], pie: "music_pieces" },
    "Daily Music Piece Creation Trends": { bar: ["music_pieces_created", "active_composers"], pie: "music_pieces_created" },
    "Weekly Collaboration Trends": { bar: ["music_pieces", "audio_engineers_involved"], pie: "music_pieces" },
    "Monthly Feedback Trends": { bar: ["feedback_count", "composers_with_feedback"], pie: "feedback_count" },
    "User Activity by Role": { bar: ["users_joined", "active_users"], pie: "users_joined" },
    "Quarterly Music Piece Output": { bar: ["music_pieces", "composers"], pie: "music_pieces" },
    "Feedback Response Time Analysis": { bar: ["feedback_count", "composers_involved"], pie: "feedback_count" },
    "Team Collaboration Overview": { bar: ["audio_engineer_count", "programmer_count"], pie: "audio_engineer_count" },
    "Cross-Role Collaboration Matrix": { bar: ["audio_engineer_collabs", "programmer_collabs"], pie: "audio_engineer_collabs" },
    "Project Collaboration Depth": { bar: ["audio_engineer_count", "programmer_count"], pie: "audio_engineer_count" },
    "Role Interaction Density": { bar: ["music_pieces", "role_count"], pie: "music_pieces" }
  };

  const allKeys = Object.keys(data[0]);
  const labelKey = allKeys[0];
  const labels = data.map(item => String(item[labelKey]));
  const xAxisLabel = labelKey.replace(/_/g, ' ').toUpperCase();
  let datasets = [];

  const colors = [
    { background: "#1f77b4", border: "#1f77b4" }, // Blue
    { background: "#ff7f0e", border: "#ff7f0e" }  // Orange
  ];

  if (importantColumnsMapping[reportTitle]) {
    if (chartType === 'pie') {
      const key = importantColumnsMapping[reportTitle].pie;
      if (!key || !(key in data[0])) return null;
      datasets.push({
        label: key.replace(/_/g, ' ').toUpperCase(),
        data: data.map(item => parseFloat(item[key]) || 0),
        backgroundColor: generatePieColors(labels.length),
        borderColor: '#fff',
        borderWidth: 1
      });
    } else {
      const keys = importantColumnsMapping[reportTitle].bar.slice(0, 2);
      if (!keys.length) return null;
      keys.forEach((key, index) => {
        if (!(key in data[0])) return;
        datasets.push({
          label: key.replace(/_/g, ' ').toUpperCase(),
          data: data.map(item => parseFloat(item[key]) || 0),
          backgroundColor: colors[index % colors.length].background,
          borderColor: colors[index % colors.length].border,
          borderWidth: 1
        });
      });
    }
  } else {
    const numericCandidates = allKeys.slice(1).filter(key => !isNaN(parseFloat(data[0][key])));
    if (!numericCandidates.length) return null;
    numericCandidates.slice(0, 2).forEach((key, index) => {
      datasets.push({
        label: key.replace(/_/g, ' ').toUpperCase(),
        data: data.map(item => parseFloat(item[key]) || 0),
        backgroundColor: colors[index % colors.length].background,
        borderColor: colors[index % colors.length].border,
        borderWidth: 1
      });
    });
  }
  return { labels, datasets, xAxisLabel };
}

function renderChart(type, chartData) {
  const ctx = document.getElementById('reportChart').getContext('2d');
  let dataForChart = type === 'pie' ?
    { labels: chartData.labels, datasets: [chartData.datasets[0]] } :
    chartData;

  if (type === 'pie') {
    dataForChart.datasets[0].backgroundColor = generatePieColors(dataForChart.labels.length);
    dataForChart.datasets[0].borderColor = '#fff';
  }

  const chartConfig = {
    type: type,
    data: dataForChart,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { size: 12, family: 'Segoe UI' },
            color: '#333'
          }
        },
        title: {
          display: true,
          text: document.getElementById('reportTitle').textContent,
          font: { size: 16, family: 'Segoe UI', weight: 'bold' },
          color: '#1D3557'
        },
        datalabels: {
          color: type === 'pie' ? '#fff' : '#333',
          font: { size: 10, family: 'Segoe UI', weight: type === 'pie' ? 'bold' : 'normal' },
          formatter: (value, ctx) => {
            if (type === 'pie') {
              const total = ctx.chart.data.datasets[0].data.reduce((acc, cur) => acc + cur, 0);
              return total ? ((value / total) * 100).toFixed(1) + '%' : '0%';
            }
            return value;
          },
          anchor: type === 'pie' ? 'center' : 'end',
          align: type === 'pie' ? 'center' : 'top',
          offset: type === 'pie' ? 0 : 5
        }
      },
      scales: type !== 'pie' ? {
        x: {
          title: {
            display: true,
            text: chartData.xAxisLabel || 'Categories',
            font: { size: 12, family: 'Segoe UI' },
            color: '#333'
          },
          grid: { display: false }
        },
        y: {
          title: {
            display: true,
            text: 'Values',
            font: { size: 12, family: 'Segoe UI' },
            color: '#333'
          },
          grid: { color: '#e0e0e0' },
          beginAtZero: true
        }
      } : {}
    }
  };

  if (currentChart) currentChart.destroy();
  currentChart = new Chart(ctx, chartConfig);
}

function generatePieColors(count) {
  const predefined = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
    "#ff9896", "#aec7e8", "#ffbb78", "#c5b0d5", "#c49c94"
  ];
  return count <= predefined.length ?
    predefined.slice(0, count) :
    Array.from({ length: count }, (_, i) =>
      `hsl(${Math.floor(360 * i / count)}, 85%, 65%)`
    );
}

function renderTable(data) {
  const table = document.createElement('table');
  table.className = 'report-table';
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  Object.keys(data[0]).forEach(key => {
    const th = document.createElement('th');
    th.textContent = key.replace(/_/g, ' ').toUpperCase();
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  data.forEach(row => {
    const tr = document.createElement('tr');
    Object.values(row).forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  document.getElementById('reportContent').appendChild(table);
}

function updateReport() {
  const reportType = document.getElementById('reportType').value;
  const contentContainer = document.getElementById('reportContent');
  const chartContainer = document.getElementById('chartContainer');
  contentContainer.innerHTML = '';
  if (currentChart) {
    currentChart.destroy();
    currentChart = null;
  }
  if (!currentData || !currentData.length) {
    alert('No data available for the selected query.');
    return;
  }
  if (reportType === 'table') {
    chartContainer.style.display = 'none';
    renderTable(currentData);
  } else {
    const chartData = prepareChartData(currentData, reportType);
    if (!chartData) {
      alert('Failed to prepare chart data');
      return;
    }
    chartContainer.style.display = 'block';
    renderChart(reportType, chartData);
  }
}

function printReport() {
  const reportContainer = document.getElementById('reportContainer');
  const clonedContent = reportContainer.cloneNode(true);

  const originalCanvases = reportContainer.getElementsByTagName('canvas');
  const clonedCanvases = clonedContent.getElementsByTagName('canvas');
  for (let i = 0; i < originalCanvases.length; i++) {
    const img = document.createElement('img');
    img.src = originalCanvases[i].toDataURL("image/png");
    img.className = 'chart-image';
    img.style.maxWidth = '90%'; // Increased to make chart larger
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '0 auto';
    clonedCanvases[i].parentNode.replaceChild(img, clonedCanvases[i]);
  }

  const printWindow = window.open('', '', 'height=800,width=1000');
  printWindow.document.write(`
    <html>
      <head>
        <title>${document.getElementById('reportTitle').textContent.trim() || 'Report'}</title>
        <style>
          :root {
            --primary-color: #1D3557;
            --secondary-color: #34495E;
            --accent-color: #E63946;
            --text-color: #343A40;
            --border-color: #BDC3C7;
            --background-color: #EBEBEB;
            --hover-color: #1A252F;
            --button-bg: #E67E22;
            --card-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            --card-hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #fff;
            color: var(--text-color);
            padding: 10mm 15mm;
            overflow: visible;
          }
          .report-container {
            background-color: #fff;
            padding: 1rem;
            margin: 0;
            max-width: 100%;
            width: 100%;
          }
          .report-header {
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--border-color);
            text-align: center;
            page-break-inside: avoid;
          }
          .logo-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin: 0;
            padding: 0;
          }
          .logo {
            width: 70px;
            height: 70px;
            border-radius: 0.5rem;
            overflow: hidden;
            background-color: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .title-section {
            margin-top: 0.5rem;
          }
          .title-section .sub-title {
            font-size: 1rem;
            color: var(--button-bg);
            font-weight: bold;
            margin: 5px 0;
          }
          .title-section h1 {
            font-size: 1.6rem;
            font-weight: bold;
            color: var(--secondary-color);
            margin: 5px 0;
          }
          .report-content {
            margin-bottom: 1rem;
            page-break-inside: auto;
          }
          .chart-container {
            max-width: 90%; /* Increased to make chart larger */
            margin: 1rem auto;
            height: auto;
            page-break-inside: avoid;
            text-align: center;
          }
          .chart-image {
            max-width: 90%; /* Increased to make chart larger */
            height: auto;
            display: block;
            margin: 0 auto;
          }
          .report-table {
            border-collapse: collapse;
            margin: 1rem 0;
            width: 100%;
            table-layout: auto;
            page-break-inside: auto;
          }
          .report-table th,
          .report-table td {
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            text-align: left;
            font-size: 0.9rem;
          }
          .report-table th {
            background-color: var(--primary-color);
            color: #fff;
            font-weight: 600;
          }
          .report-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          .comment-section {
            margin: 0.5rem 0; /* Reduced margin */
            padding: 0.5rem; /* Reduced padding */
            background-color: #F8F9FA;
            border-radius: 0.5rem;
            page-break-inside: avoid;
          }
          .comment-label {
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--secondary-color);
            font-size: 0.9rem; /* Smaller font */
          }
          .comment-content {
            min-height: 40px; /* Reduced height */
            padding: 0.5rem; /* Reduced padding */
            border: 1px solid var(--border-color);
            border-radius: 0.5rem;
            background-color: #fff;
            font-size: 0.8rem; /* Smaller font size */
          }
          .signature-section {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin: 1rem 0;
            padding-top: 0.8rem;
            border-top: 1px solid var(--border-color);
            page-break-inside: avoid;
          }
          .signature-wrapper {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .signature-line {
            width: 100%;
            border-bottom: 2px dotted #333;
            margin: 0.5rem 0;
          }
          .report-generated {
            text-align: right;
            font-size: 0.8rem;
            color: #666;
          }
          .report-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;
            color: #666;
            border-top: 1px solid var(--border-color);
            padding-top: 0.8rem;
            page-break-inside: avoid;
          }
          @page {
            margin: 15mm;
            @bottom-center {
              content: "Page " counter(page) " of " counter(pages);
            }
          }
          @media print {
            body {
              margin: 0;
            }
            .report-container {
              box-shadow: none;
            }
            table {
              overflow: visible;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${clonedContent.outerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();

  // Flag to ensure close is only called once after printing
  let printingDone = false;

  // Listen for the 'afterprint' event
  printWindow.addEventListener('afterprint', (event) => {
    console.log('Afterprint event fired');
    if (!printingDone) {
        printingDone = true;
        printWindow.close();
    }
  });

  printWindow.onload = () => {
    printWindow.focus(); 
    printWindow.print();
  };
}

function toggleShareMenu() {
  document.getElementById('shareMenu').classList.toggle('active');
}

function shareViaWhatsApp() {
  const message = encodeURIComponent("Check out this report: ");
  const url = encodeURIComponent(window.location.href);
  window.open(`https://wa.me/?text=${message}%0A${url}`, '_blank');
}

function shareViaEmail() {
  const subject = encodeURIComponent("Generated Report");
  const body = encodeURIComponent("Please find the report at: " + window.location.href);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

async function processCrudOperation() {
  const operation = document.querySelector('input[name="crudOperation"]:checked').value;
  if (operation === "add") await addQuery();
  else if (operation === "update") await updateQuery();
  else if (operation === "delete") await deleteQuery();
}

async function addQuery() {
  const name = document.getElementById("addQueryName").value.trim();
  const queryText = document.getElementById("addQueryText").value.trim();
  const category = document.getElementById("addQueryCategory").value;
  if (!name || !queryText) {
    alert("Please enter query name and query text.");
    return;
  }
  try {
    const response = await fetch('https://8080-01jrr2n0pracv1ekcjdzfy007x.cloudspaces.litng.ai/queries/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, query: queryText, category })
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData);
    }
    const result = await response.json();
    await loadQueries();
    alert("Query added successfully! New Query ID: " + result.system_query_id);
    clearCrudFields();
  } catch (error) {
    console.error('Error adding query:', error);
    alert("Error adding query: " + error.message);
  }
}

async function updateQuery() {
  const id = document.getElementById("updateQueryId").value.trim();
  const name = document.getElementById("updateQueryName").value.trim();
  const queryText = document.getElementById("updateQueryText").value.trim();
  if (!id || (!name && !queryText)) {
    alert("Please enter query ID and at least one field to update.");
    return;
  }
  const payload = { system_query_id: Number(id) };
  if (name) payload.name = name;
  if (queryText) payload.query = queryText;
  try {
    const response = await fetch(`https://8080-01jrr2n0pracv1ekcjdzfy007x.cloudspaces.litng.ai/queries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    if (!response.ok) throw new Error(text);
    alert("Query updated successfully!");
    clearCrudFields();
    await loadQueries();
  } catch (error) {
    console.error('Error updating query:', error);
    alert("Error updating query: " + error.message);
  }
}

async function deleteQuery() {
  const id = document.getElementById("deleteQueryId").value.trim();
  if (!id) {
    alert("Please enter query ID to delete.");
    return;
  }
  try {
    const response = await fetch(`https://8080-01jrr2n0pracv1ekcjdzfy007x.cloudspaces.litng.ai/queries/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    const text = await response.text();
    if (!response.ok) throw new Error(text);
    alert("Query deleted successfully!");
    clearCrudFields();
    await loadQueries();
  } catch (error) {
    console.error('Error deleting query:', error);
    alert("Error deleting query: " + error.message);
  }
}

function clearCrudFields() {
  document.getElementById("addQueryName").value = "";
  document.getElementById("addQueryText").value = "";
  document.getElementById("updateQueryId").value = "";
  document.getElementById("updateQueryName").value = "";
  document.getElementById("updateQueryText").value = "";
  document.getElementById("deleteQueryId").value = "";
}