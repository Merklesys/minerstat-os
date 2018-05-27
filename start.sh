#! /usr/bin/bash

tmux \
    new-session 'sh bin/header.sh' \; \
    split-window 'sh start.sh' \; \
    resize-pane -U 12 \; \
    send-keys C-a M-3 \; 