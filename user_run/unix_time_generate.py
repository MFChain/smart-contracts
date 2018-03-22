#!/usr/bin/env python3
# -*- coding: UTF-8 -*-

'''
  Generate correct unixtime
'''

import datetime

def get_correct_unixtime(p_min):
    c_t = datetime.datetime.now()
    ct_pm = c_t + datetime.timedelta(minutes = p_min)
    return int(ct_pm.timestamp())

gcut5 = get_correct_unixtime(5)
gcut20 = get_correct_unixtime(20)
print(str(gcut5) + " " + str(gcut20))


