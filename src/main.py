#!/usr/bin/env python

from __future__ import absolute_import, print_function, unicode_literals

from flask import Flask, jsonify, send_from_directory, render_template, request
import json
import os
import sys
import progression as prg

app = Flask(__name__)

def _load_data(filename):
    with open(os.path.join('data', filename), 'r') as f:
        return json.load(f)

bookmarks = [
    {'linktext':'Refraction (original (shortened) vs. brainpop)', 'url':'/static/comparison/index.html?a=refraction_short_collapsed.json&b=refraction_brainpop_collapsed.json'},
    {'linktext':'Refraction (original vs. generated)', 'url':'/static/comparison/index.html?a=refraction_original_collapsed.json&b=infrefr_gen_long_collapsed.json'},
    {'linktext':'Refraction (slow-pace generated vs. fast-pace generated)', 'url':'/static/comparison/index.html?a=infrefr_gen_long_collapsed.json&b=infrefr_gen_highpace_long_collapsed.json'},
    {'linktext':'Refraction (random vs. generated)', 'url':'/static/comparison/index.html?a=infrefr_rand_long_collapsed.json&b=infrefr_gen_long_collapsed.json'},
    {'linktext':'Refraction (original vs. random)', 'url':'/static/comparison/index.html?a=refraction_original_collapsed.json&b=infrefr_rand_long_collapsed.json'},
]

@app.route('/', methods=['GET'])
def default():
    return render_template('listing.html', bookmarks=bookmarks)

@app.route('/data/')
def get_data_list():
    return jsonify(files=[x for x in sorted(os.listdir('data'))])

@app.route('/data/plan/<path:filename>')
def get_data_plan(filename):
    return send_from_directory('data', filename)

@app.route('/data/combos/<path:filename>')
def get_data_combos(filename):
    return jsonify(**prg.combos(_load_data(filename)))

@app.route('/data/mds/<path:filename>')
def get_data_mds(filename):
    with open(os.path.join('data', filename), 'r') as f:
        return jsonify(**prg.mds(json.load(f)))

@app.route('/data/project')
def get_projected_data():
    args = request.args
    func = args.get('func')
    file_list = json.loads(args.get('files'))
    return jsonify(**prg.project(func, [_load_data(fn) for fn in file_list]))

@app.after_request
def add_header(response):
    # make the chrome cache bugger off, never want this during debugging
    response.headers['Cache-Control'] = 'public, max-age=0'
    return response

if __name__ == '__main__':
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    else:
        port = 5000

    if "PUBLIC_FLASK" in os.environ:
        app.run(host='0.0.0.0', port=port)
    else:
        app.run(debug=True, port=port)

