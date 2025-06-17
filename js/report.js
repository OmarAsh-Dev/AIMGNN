// Initialize Select2
$(document).ready(function() {
    $('.select2-multiple').select2({
        theme: 'bootstrap-5',
        width: '100%',
        placeholder: 'Select options',
        allowClear: true
    });

    // Filter columns based on selected tables
    $('#tables').on('change', function() {
        const selectedTables = $(this).val();
        const columnsSelect = $('#columns');
        
        // Hide all options first
        columnsSelect.find('option').hide();
        
        // Show only options for selected tables
        selectedTables.forEach(table => {
            columnsSelect.find(`option[data-table="${table}"]`).show();
        });
        
        // Remove selected options that are no longer available
        const validOptions = columnsSelect.find('option:visible').map(function() {
            return this.value;
        }).get();
        
        const currentSelections = columnsSelect.val() || [];
        const newSelections = currentSelections.filter(value => validOptions.includes(value));
        
        columnsSelect.val(newSelections).trigger('change');
    });

    // Add condition to filters list
    document.getElementById('addConditionBtn').addEventListener('click', function() {
        const field = document.getElementById('conditionField').value;
        const operator = document.getElementById('conditionOperator').value;
        const value = document.getElementById('conditionValue').value;

        if (!field || !operator || !value) {
            alert('Please fill all fields');
            return;
        }

        const filterItem = document.createElement('div');
        filterItem.className = 'alert alert-info d-flex justify-content-between align-items-center';
        filterItem.innerHTML = `
            <span>${field} ${operator} ${value}</span>
            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">Remove</button>
        `;

        document.getElementById('filtersList').appendChild(filterItem);

        // Clear input fields
        document.getElementById('conditionValue').value = '';
    });

    // Add manual condition
    document.getElementById('manualCondition').addEventListener('change', function() {
        const manualValue = this.value;
        if (manualValue) {
            const filterItem = document.createElement('div');
            filterItem.className = 'alert alert-info d-flex justify-content-between align-items-center';
            filterItem.innerHTML = `
                <span>${manualValue}</span>
                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">Remove</button>
            `;

            document.getElementById('filtersList').appendChild(filterItem);
            this.value = ''; // Clear the manual input
        }
    });

    // Add predefined query
    document.getElementById('predefinedQuery').addEventListener('change', function() {
        const selectedQuery = this.value;
        if (selectedQuery) {
            const filterItem = document.createElement('div');
            filterItem.className = 'alert alert-info d-flex justify-content-between align-items-center';
            filterItem.innerHTML = `
                <span>${selectedQuery}</span>
                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">Remove</button>
            `;

            document.getElementById('filtersList').appendChild(filterItem);
            this.value = ''; // Clear the predefined query selection
        }
    });

    // Handle Join Type Selection
    const joinTypeSelect = document.getElementById('joinType');
    const clearJoinTypeBtn = document.getElementById('clearJoinTypeBtn');

    // Show the clear button when a join type is selected
    joinTypeSelect.addEventListener('change', function() {
        if (this.value) {
            clearJoinTypeBtn.style.display = 'inline-block'; // Show the "X" button
        } else {
            clearJoinTypeBtn.style.display = 'none'; // Hide the "X" button
        }
    });

    // Clear the selection when the "X" button is clicked
    clearJoinTypeBtn.addEventListener('click', function() {
        joinTypeSelect.selectedIndex = 0; // Reset to the placeholder option
        this.style.display = 'none'; // Hide the "X" button
    });
});

// Show/Hide Date Range Section Based on Time Period Selection
document.getElementById('timePeriod').addEventListener('change', function() {
    const dateRangeSection = document.getElementById('dateRangeSection');
    if (this.value === 'custom') {
        dateRangeSection.style.display = 'block';
    } else {
        dateRangeSection.style.display = 'none';
    }
});

// Show/Hide Chart Type Section Based on Report Type Selection
document.getElementById('reportType').addEventListener('change', function() {
    const chartTypeSection = document.getElementById('chartTypeSection');
    if (this.value === 'chart') {
        chartTypeSection.style.display = 'block';
    } else {
        chartTypeSection.style.display = 'none';
    }
});

// Handle Form Submission
document.getElementById('reportForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent default form submission
    document.getElementById('loadingSpinner').style.display = 'block'; // Show loading spinner

    const predefinedQuery = document.getElementById('predefinedQuery') ? document.getElementById('predefinedQuery').value : ''; // Get predefined query
    const selectedTables = Array.from(document.getElementById('tables').selectedOptions).map(option => option.value); // Get selected tables
    const reportType = document.getElementById('reportType').value; // Get report type (Table or Chart)

    // Prepare request data
    const requestData = {
        predefined_query: predefinedQuery, // Pass predefined query
        tables: selectedTables, // Pass selected tables
        columns: [], // Leave empty
        join_type: null, // Leave empty
        conditions: [] // Leave empty
    };

    try {
        const response = await fetch('http://127.0.0.1:8000/generate_report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();
        if (response.ok) {
            // Display results based on report type
            const resultsContainer = document.getElementById('resultsContainer');
            resultsContainer.innerHTML = ''; // Clear previous content

            if (result.data.length > 0) {
                if (reportType === 'table') {
                    // Create table
                    const table = document.createElement('table');
                    table.className = 'table table-striped'; // Apply Bootstrap styling

                    // Create table header
                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');
                    Object.keys(result.data[0]).forEach(key => {
                        const th = document.createElement('th');
                        th.textContent = key; // Column name
                        headerRow.appendChild(th);
                    });
                    thead.appendChild(headerRow);
                    table.appendChild(thead);

                    // Create table body
                    const tbody = document.createElement('tbody');
                    result.data.forEach(row => {
                        const tr = document.createElement('tr');
                        Object.values(row).forEach(value => {
                            const td = document.createElement('td');
                            td.textContent = value; // Cell value
                            tr.appendChild(td);
                        });
                        tbody.appendChild(tr);
                    });
                    table.appendChild(tbody);

                    // Append table to the container
                    resultsContainer.appendChild(table);

                } if (reportType === 'chart') {
                    // Prepare data for chart
                    const columns = Object.keys(result.data[0]); // Get column names
                    const labels = result.data.map(item => item[columns[0]]); // Use first column as labels
                    const dataValues = result.data.map(item => item[columns[1]]); // Use second column as values
                
                    // Create chart using Chart.js
                    const ctx = document.createElement('canvas');
                    resultsContainer.appendChild(ctx);
                    const chart = new Chart(ctx, {
                        type: 'bar', // Chart type (bar, line, pie, etc.)
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Data', // Dataset label
                                data: dataValues,
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 1
                            }]
                        },
                        options: {
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }
                    });
                }

            } else {
                resultsContainer.innerHTML = '<p>No data found.</p>';
            }
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        document.getElementById('loadingSpinner').style.display = 'none'; // Hide loading spinner
    }
});
