"""Progression plan manipulation routines"""

from __future__ import absolute_import, print_function, unicode_literals

import numpy as np
import sklearn
import sklearn.metrics
import sklearn.manifold
import sklearn.preprocessing

def combos(jdata):
    """Returns a matrix of co-ocurrences of concepts in all levels"""
    labels = jdata['concept_labels']
    nc = len(labels)

    count_vector = np.zeros(shape=nc, dtype=int)
    co_count_matrix = np.zeros(shape=(nc, nc), dtype=int)

    for lvl in jdata['instances']:
        a = np.array(lvl)
        count_vector += a
        co_count_matrix += np.outer(a, a)

    co_ratio_matrix = co_count_matrix.astype(float) / count_vector[:, np.newaxis]
    co_ratio_matrix = np.where(np.isnan(co_ratio_matrix), 0, co_ratio_matrix)

    return {
        # list, the concept labels
        'concept_labels':jdata['concept_labels'],
        # list, the number of levels in which each concept occurs
        'concept_counts':count_vector.tolist(),
        # matrix, M[i][j] is the number of levels in which concepts i,j both occur
        'combo_counts':co_count_matrix.tolist(),
        # matrix, M[i][j] ratio of number of levels in which both i,j occur over number where i occur
        'combo_ratio':co_ratio_matrix.tolist(),
    }

def _combine(jdata_list):
    # first compute a unioned concept list
    concepts = sorted(frozenset().union(*[d['concept_labels'] for d in jdata_list]))
    # transform each instance list into a 2d numpy array where concepts are mapped into the correct columns
    def remap(jdata):
        orig = np.array(jdata['instances'])
        inst = np.zeros(shape=(orig.shape[0],len(concepts)))
        for i,c in enumerate(jdata['concept_labels']):
            inst[:,concepts.index(c)] = orig[:,i]
        return inst.astype(np.float64)

    insts = [remap(d) for d in jdata_list]

    # used to unconcatenate the instances
    splits = []
    counter = 0
    for i in insts[:-1]:
        counter += i.shape[0]
        splits.append(counter)

    return concepts, np.concatenate(insts), splits

def _scale_projection(pos):
    '''Scales a projection into the range [0,1] (plus a small buffer)'''
    mn = np.min(pos)
    mx = np.max(pos)
    pos = (pos - mn) / (mx - mn)
    # HACK move everything a bit away from the edges, so visualizations can assume nodes are not right up against the edge
    pos = pos * .96 + 0.02;
    return pos

def _mds(X):
    mds = sklearn.manifold.MDS(n_components=2)
    return mds.fit_transform(X)

def project(method, jdata_list):
    concepts, X, split_indices = _combine(jdata_list)
    if method != 'mds': raise ValueError('only mds is currently supported')
    pos = _scale_projection(_mds(X))

    instances = np.split(X, split_indices)
    paths = np.split(pos, split_indices)

    return {
        'concept_labels':concepts,
        'projections':[{'instances':i.tolist(), 'path':p.tolist()} for i,p in zip(instances, paths)],
    }

def mds(jdata):
    X = np.array(jdata['instances'], dtype=np.float64)
    mds = sklearn.manifold.MDS(n_components=2)
    pos = _scale_projection(mds.fit_transform(X)).tolist()

    return {
        'concept_labels':jdata['concept_labels'],
        'stage_labels':jdata['stage_labels'],
        'stage_values':jdata.get('stage_values',None),
        'instances':jdata['instances'],
        'path':pos,
    }

