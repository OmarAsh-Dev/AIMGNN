<p align="center">
  <img src="images/logo.png" alt="AIMGNN Logo" width="200"/>
</p>

# AIMGNN

AIMGNN is a full-stack AI-powered music generation platform built with a vanilla JavaScript frontend and a Python FastAPI backend leveraging Meta's MusicGen model. Users can generate high-quality music by entering text prompts or uploading melody seeds, preview results in-browser, and download compositions.

---

## Table of Contents

* [Features](#features)
* [Repository Structure](#repository-structure)
* [Prerequisites](#prerequisites)
* [Installation & Setup](#installation--setup)
* [Usage](#usage)
  * [Generating Music via Frontend](#generating-music-via-frontend)
  * [User Workflow](#user-workflow)
* [API Endpoints](#api-endpoints)
* [Samples](#samples)
* [Citations](#citations)
* [Acknowledgments](#acknowledgments)
* [Contributors](#contributors)
* [Made By](#made-by)

---

## Features

* 🎵 **Text-to-Music Generation** – Generate music from text prompts using advanced AI algorithms.
* 🎛️ **Customizable Music** – Edit and fine-tune generated music with prompt-based customization.
* 💾 **Download & Share** – Download your music in high-quality formats and share it with the world.
* ⚙️ **Advanced Controls** – Fine-tune tempo, pitch, and other parameters.

---

## Repository Structure

```
AIMGNN/
├── css/                   # Stylesheets
├── gifs/                  # Animated assets
├── images/                # Static images
├── js/                    # JavaScript modules
├── music/                 # Audio output files
├── musicgen/              # Python backend with MusicGen
├── *.html                 # Frontend HTML pages
├── README.md              # This file
├── requirements.txt       # Backend dependencies
└── account.html, dashboard.html, ...
```

---

## Prerequisites

* Python 3.8+
* Git
* A modern browser (Chrome, Firefox, etc.)

---

## Installation & Setup

```bash
# Clone repository
git clone https://github.com/OmarAsh-Dev/AIMGNN.git
cd AIMGNN

# Setup virtual environment
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt
pip install transformers audiocraft
```

---

## Run the App

```bash
Start server_g.py using uvicorn 
better run it on a platform like Lightning Ai and use Api builder for hosting it
```

```bash
# Serve frontend
python -m http.server 3000
# Open http://localhost:3000/index.html in your browser
```

---

## Usage

### Generating Music via Frontend

1. Open `generate.html`.
2. Enter a **text prompt**.
3. Optionally upload a melody seed (`.wav` or `.mp3`).
4. Click **Generate**.
5. Preview or download the result.

---

### User Workflow

1. 💡 Generate music with text or melody input.
2. 🧪 Customize tempo, pitch, and duration.
3. 💾 Download and 🎧 share your creation.

---

## API Endpoints

* `POST /predict`

  * `prompt` (string)
  * `duration` (int, seconds)

* `POST /interpolation`

  * `prompt` (string)
  * `melody` (file: .wav/.midi)
  * `duration` (int, seconds)

---

## Samples

🎧 Example compositions generated using AIMGNN:

<p>
  <audio controls>
    <source src="music/sample1.wav" type="audio/wav">
    Your browser does not support the audio element.
  </audio>
</p>

<p>
  <audio controls>
    <source src="music/sample2.wav" type="audio/wav">
    Your browser does not support the audio element.
  </audio>
</p>

<p>
  <audio controls>
    <source src="music/sample3.wav" type="audio/wav">
    Your browser does not support the audio element.
  </audio>
</p>

---

## Citations

Please cite Meta's original research:

```bibtex
@inproceedings{copet2023musicgen,
  title = {Simple and Controllable Music Generation},
  author = {Copet, Jade and Kreuk, Felix and Gat, Itai and Remez, Tal and Kant, David and Synnaeve, Gabriel and Adi, Yossi and Défossez, Alexandre},
  booktitle = {Proc. of the 40th International Conference on Machine Learning},
  year = {2023},
  note = {arXiv:2306.05284}
}
```

```bibtex
@misc{defossez2022encodec,
  title={EnCodec: Efficient Neural Audio Compression},
  author={Défossez, Alexandre and Zeghidour, Neil and Usunier, Nicolas and Bottou, Léon and Synnaeve, Gabriel},
  year={2022},
  eprint={2211.02231},
  archivePrefix={arXiv},
  primaryClass={cs.CV}
}
```

---

## Acknowledgments

* [MusicGen by Meta AI](https://github.com/facebookresearch/audiocraft)
* Meta for open-sourcing cutting-edge research
* Early testers and community contributors

---


## Contributors

<a href="https://github.com/OmarAsh-Dev"><img src="https://avatars.githubusercontent.com/OmarAsh-Dev" width="50"/></a>

Want to contribute? Open a PR or issue!

---

## Made By

| GitHub Username                                          | Full Name                
| -------------------------------------------------------- | ------------------------ 
| [@OmarAsh-Dev](https://github.com/OmarAsh-Dev)           | Omar Ahmed Shawqi           
| [@Ahmed47Sameh](https://github.com/Ahmed47Sameh)         | Ahmed Sameh Saad 
| [@MOHAMEDRAGEB2020](https://github.com/MOHAMEDRAGEB2020) | Mohamed Ali Ragab  
| [@Abo4samra](https://github.com/Abo4samra)               | Ahmed Samir Mahmmod    
| [@pro-mohamed](https://github.com/pro-mohamed)           | Mohamed Abd El-mohsen    
| [@ahmedhunter25](https://github.com/ahmedhunter25)       | Ahmed Kamal     
