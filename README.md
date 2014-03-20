
How to Run
----------

The program is web-based, but requires a python web server backend to do the MDS computation. The primary python packages it requires are:
* [Flask](http://flask.pocoo.org/)
* numpy
* scipy
* matplotlib
* [scikit-learn](http://scikit-learn.org/stable/)
These packages are all available in pip, and can be installed with
```
pip install -r req.txt
```
The entry point is `src/main.py`. It will launch a webserver on `localhost:5000`.

So, for example, on a recent ubuntu distro, the program can be setup and run with:
```
sudo apt-get install python-virtualenv
virtualenv venv/
source venv/bin/activate
pip install -r req.txt
cd src/
./main.py
```
The open `http://localhost:5000/` in a browser.



