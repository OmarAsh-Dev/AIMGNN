document.querySelectorAll('input[type="range"]').forEach(element => {
    element.addEventListener('input', updateDisplay);
});

function updateDisplay() {
    const displayElement = document.getElementById(`${this.id}-value`);
    const rawValue = parseFloat(this.value);
    
    // Handle boolean sliders
    if(this.id === 'use-sampling' || this.id === 'two-step-cfg') {
        displayElement.textContent = rawValue ? 'True' : 'False';
        return;
    }
    
    if(this.id === 'temperature') {
        displayElement.textContent = (rawValue / 10).toFixed(1);
    } else if(this.id === 'top-p') {
        displayElement.textContent = (rawValue / 100).toFixed(2);
    } else {
        displayElement.textContent = rawValue.toFixed(1);
    }
    
    updateCodeArea();
}

const presets = {
    default: {
        use_sampling: 1,
        top_k: 250,
        top_p: 0,
        temperature: 10,
        cfg_coef: 3,
        two_step_cfg: 0,
        extend_stride: 18
    },
    creative: {
        use_sampling: 1,
        top_k: 100,
        top_p: 90,
        temperature: 15,
        cfg_coef: 4.5,
        two_step_cfg: 0,
        extend_stride: 20
    },
    precise: {
        use_sampling: 1,
        top_k: 400,
        top_p: 10,
        temperature: 5,
        cfg_coef: 2,
        two_step_cfg: 1,
        extend_stride: 15
    }
};

function loadPreset(type) {
    const preset = presets[type];
    
    document.getElementById('use-sampling').value = preset.use_sampling;
    document.getElementById('top-k').value = preset.top_k;
    document.getElementById('top-p').value = preset.top_p;
    document.getElementById('temperature').value = preset.temperature;
    document.getElementById('cfg-coef').value = preset.cfg_coef;
    document.getElementById('two-step-cfg').value = preset.two_step_cfg;
    document.getElementById('extend-stride').value = preset.extend_stride;

    document.querySelectorAll('input[type="range"]').forEach(element => {
        element.dispatchEvent(new Event('input'));
    });
}

function updateCodeArea() {
    const settings = {
        use_sampling: parseInt(document.getElementById('use-sampling').value),
        top_k: parseInt(document.getElementById('top-k').value),
        top_p: parseFloat(document.getElementById('top-p').value) / 100,
        temperature: parseFloat(document.getElementById('temperature').value) / 10,
        cfg_coef: parseFloat(document.getElementById('cfg-coef').value),
        two_step_cfg: parseInt(document.getElementById('two-step-cfg').value),
        extend_stride: parseInt(document.getElementById('extend-stride').value)
    };

    const pythonCode = `model.set_generation_params(
use_sampling=${settings.use_sampling ? 'True' : 'False'},
top_k=${settings.top_k},
top_p=${settings.top_p % 1 === 0 ? settings.top_p.toFixed(0) : settings.top_p.toFixed(1)},
temperature=${settings.temperature},
cfg_coef=${settings.cfg_coef},
two_step_cfg=${settings.two_step_cfg ? 'True' : 'False'},
extend_stride=${settings.extend_stride}
)`;

    document.getElementById('modified-config').value = pythonCode;
}

document.querySelector('.save-btn').addEventListener('click', async function() {
    // Collect the slider values and convert them to the expected types
    const settings = {
        use_sampling: !!parseInt(document.getElementById('use-sampling').value),
        top_k: parseInt(document.getElementById('top-k').value),
        top_p: parseFloat(document.getElementById('top-p').value) / 100,
        temperature: parseFloat(document.getElementById('temperature').value) / 10,
        cfg_coef: parseFloat(document.getElementById('cfg-coef').value),
        two_step_cfg: !!parseInt(document.getElementById('two-step-cfg').value),
        extend_stride: parseInt(document.getElementById('extend-stride').value)
    };

    console.log('Saving settings locally:', settings);

    // Send the parameters to the FastAPI /set-params endpoint
    try {
        const response = await fetch('https://8080-01jn12c923ggt7x62zr7n2zekz.cloudspaces.litng.ai/set-params', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Server response:', data);
        alert('Settings saved successfully via API!');
    } catch (err) {
        console.error('Failed to set parameters:', err);
        alert('Error saving settings via API. See console for details.');
    }
});


loadPreset('default');
updateCodeArea();