#!/usr/bin/env python3
# -*- coding: UTF-8 -*-

'''
  Generate correct unixtime
'''

import datetime


def get_correct_unixtime(p_min):
    #return unixtime + p_min
    c_t = datetime.datetime.now()
    ut_create = int(datetime.datetime(
        c_t.year, 
        c_t.month, 
        c_t.day, 
        c_t.hour, 
        c_t.minute + p_min,
        c_t.second
        ).timestamp())
    return str(ut_create)

gcut = get_correct_unixtime(5)
print(gcut)
