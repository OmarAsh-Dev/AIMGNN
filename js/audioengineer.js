
// Import the Supabase client as an ES module
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase configuration
const SUPABASE_URL = 'https://pcaiuorgyybjupibnqxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYWl1b3JneXlianVwaWJucXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMjc2MTUsImV4cCI6MjA1OTgwMzYxNX0.7sPShr6J4oa7nQ-MFjXmVUghB-ORNW5n97l3rHWMAls';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let audioEngineerIdCache = null;
let currentAudioEngineerId = null;

async function getAudioEngineerId() {
  if (audioEngineerIdCache) return audioEngineerIdCache;
  const userId = sessionStorage.getItem("userId");
  const { data } = await supabase
    .from('audioengineer')
    .select('audio_engineer_id')
    .eq('user_id', userId)
    .single();
  audioEngineerIdCache = data?.audio_engineer_id;
  return audioEngineerIdCache;
}

// Register ChartDataLabels plugin
Chart.register(ChartDataLabels);

let currentChart = null;
let currentData = null;

document.addEventListener('DOMContentLoaded', async function () {
  currentAudioEngineerId = await getAudioEngineerId();
  updateDateTime();
  setInterval(updateDateTime, 1000);
  setupEventListeners();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
  document.getElementById('endDate').value = today;
});

function setupEventListeners() {
  document.getElementById('reportType').addEventListener('change', updateReport);
  document.getElementById('startDate').addEventListener('change', handleDateChange);
  document.getElementById('endDate').addEventListener('change', handleDateChange);
  document.getElementById('datePresets').addEventListener('change', handleDatePreset);

  let lastScrollTop = 0;
  window.addEventListener("scroll", function () {
    let st = window.pageYOffset || document.documentElement.scrollTop;
    const navbar = document.querySelector('.navbar');
    if (st > lastScrollTop) {
      navbar.classList.add("hidden");
    } else {
      navbar.classList.remove("hidden");
    }
    lastScrollTop = st <= 0 ? 0 : st;
  });
}

function handleDatePreset() {
  const preset = document.getElementById('datePresets').value;
  let startDate, endDate;
  const today = new Date();
  switch (preset) {
    case 'today':
      startDate = endDate = today;
      break;
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
    default:
      return;
  }
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    alert("Error in calculating dates for preset.");
    return;
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

function updateDateTime() {
  const now = new Date();
  document.getElementById('reportGenerated').textContent = 'Report Generated: ' + now.toLocaleString();
}

async function handleDateChange() {
  await fetchReportData();
}

async function generateReport() {
  await fetchReportData();
}

async function fetchReportData() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const queryType = document.getElementById('querySelect').value;

  if (!startDate || !endDate) {
    alert('Please choose a start date and an end date.');
    return;
  }

  if (!currentAudioEngineerId) {
    alert('Audio Engineer ID is not available. Please ensure you are logged in correctly.');
    return;
  }

  console.log("Start Date:", startDate, "End Date:", endDate, "Query Type:", queryType);

  try {
    const response = await fetch('https://8082-01jrr2n0pracv1ekcjdzfy007x.cloudspaces.litng.ai/generate-report', {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_engineer_id: currentAudioEngineerId,
        query_type: queryType,
        report_type: document.getElementById('reportType').value,
        start_date: `${startDate}T00:00:00`,
        end_date: `${endDate}T23:59:59`,
        filters: {}
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${errorText}`);
    }

    const data = await response.json();
    if (data.message) {
      alert(data.message);
      currentData = [];
    } else {
      currentData = data.data;
    }
    updateReport();
  } catch (error) {
    console.error('Error fetching data:', error);
    alert(`Failed to fetch report: ${error.message}`);
  }
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
  if (!currentData || currentData.length === 0) {
    contentContainer.textContent = 'No data available for the selected criteria.';
    chartContainer.style.display = 'none';
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

function prepareChartData(data, chartType) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const allKeys = Object.keys(data[0]);
  const labelKey = allKeys[0];
  const labels = data.map(item => String(item[labelKey]));
  const xAxisLabel = labelKey.replace(/_/g, ' ').toUpperCase();
  let datasets = [];
  if (chartType === 'pie') {
    let key = allKeys[1];
    if (!key || !(key in data[0])) {
      alert('The column specified for pie chart is not available.');
      return null;
    }
    datasets.push({
      label: key.replace(/_/g, ' ').toUpperCase(),
      data: data.map(item => parseFloat(item[key]) || 0),
      backgroundColor: generatePieColors(labels.length),
      borderColor: '#fff',
      borderWidth: 1
    });
  } else {
    const numericCandidates = allKeys.slice(1).filter(key => !isNaN(parseFloat(data[0][key])));
    if (numericCandidates.length === 0) {
      alert('No numeric columns found for chart.');
      return null;
    }
    const limitedCandidates = numericCandidates.slice(0, 2);
    limitedCandidates.forEach(key => {
      datasets.push({
        label: key.replace(/_/g, ' ').toUpperCase(),
        data: data.map(item => parseFloat(item[key]) || 0),
        backgroundColor: "#66B3FF",
        borderColor: "#66B3FF",
        borderWidth: 1
      });
    });
  }
  return { labels, datasets, xAxisLabel };
}

function renderChart(type, chartData) {
  const ctx = document.getElementById('reportChart').getContext('2d');
  let dataForChart = (type === 'pie')
    ? { labels: chartData.labels, datasets: [Object.assign({}, chartData.datasets[0])] }
    : chartData;
  if (type === 'pie') {
    dataForChart.datasets[0].backgroundColor = generatePieColors(dataForChart.labels.length);
    dataForChart.datasets[0].borderColor = '#fff';
  } else if (type === 'line' || type === 'bar') {
    dataForChart.datasets.forEach(dataset => {
      dataset.backgroundColor = "#66B3FF";
      dataset.borderColor = "#66B3FF";
    });
  }
  const chartConfig = {
    type: type,
    data: dataForChart,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: document.getElementById('reportTitle').textContent }
      }
    }
  };
  if (type === 'bar' || type === 'line') {
    chartConfig.options.scales = {
      x: { title: { display: true, text: chartData.xAxisLabel || 'Categories' } },
      y: { title: { display: true, text: 'Values' } }
    };
  }
  if (type === 'line') {
    chartConfig.options.plugins.datalabels = {
      display: true,
      align: 'top',
      anchor: 'end',
      offset: 5,
      color: '#000',
      font: { weight: 'normal', size: 9 },
      formatter: value => value
    };
  } else if (type === 'pie') {
    chartConfig.options.plugins.datalabels = {
      display: true,
      anchor: 'center',
      align: 'center',
      offset: 0,
      formatter: (value, ctx) => {
        const dataArr = ctx.chart.data.datasets[0].data;
        const total = dataArr.reduce((acc, cur) => acc + cur, 0);
        if (total === 0) return '0%';
        return ((value / total) * 100).toFixed(1) + '%';
      },
      color: '#fff',
      font: { weight: 'bold' }
    };
  }
  currentChart = new Chart(ctx, chartConfig);
}

function generatePieColors(count) {
  const predefined = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
    "#ff9896", "#aec7e8", "#ffbb78", "#c5b0d5", "#c49c94"
  ];
  if (count <= predefined.length) return predefined.slice(0, count);
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = Math.floor(360 * i / count);
    colors.push(`hsl(${hue}, 85%, 65%)`);
  }
  return colors;
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

function printReport() {
  const reportContainer = document.getElementById('reportContainer');
  const clonedContent = reportContainer.cloneNode(true);

  const originalCanvases = reportContainer.getElementsByTagName('canvas');
  const clonedCanvases = clonedContent.getElementsByTagName('canvas');
  for (let i = 0; i < originalCanvases.length; i++) {
    const dataURL = originalCanvases[i].toDataURL("image/png");
    const img = document.createElement('img');
    img.src = dataURL;
    img.style.width = originalCanvases[i].style.width || originalCanvases[i].width + "px";
    img.style.height = originalCanvases[i].style.height || originalCanvases[i].height + "px";
    clonedCanvases[i].parentNode.replaceChild(img, clonedCanvases[i]);
  }

  let stylesheets = '';
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    stylesheets += `<link rel="stylesheet" href="${link.href}">`;
  });

  let inlineStyles = '';
  document.querySelectorAll('style').forEach(style => {
    inlineStyles += style.outerHTML;
  });

  const reportTitle = document.getElementById('reportTitle').textContent.trim() || 'Report';

  const printWindow = window.open('', '', 'height=800,width=1000');
  printWindow.document.write(`
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportTitle}</title>
        ${stylesheets}
        ${inlineStyles}
        <style>
          @page {
            margin: 15mm;
            @bottom-center {
              content: "Page " counter(page) " of " counter(pages);
            }
          }
          body { margin: 0; padding: 0; }
          .navbar, .control-panel, .action-buttons { display: none !important; }
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

window.generateReport = generateReport;
window.printReport = printReport;
window.toggleShareMenu = toggleShareMenu;
window.shareViaWhatsApp = shareViaWhatsApp;
window.shareViaEmail = shareViaEmail;