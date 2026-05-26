#!/bin/bash

# Define source image
SOURCE_IMAGE="./src/assets/app_logo.jpeg"
RES_DIR="./android/app/src/main/res"

# Function to resize and save
resize_icon() {
    local size=$1
    local dir=$2
    local name=$3
    mkdir -p "$RES_DIR/$dir"
    sips -z $size $size "$SOURCE_IMAGE" --out "$RES_DIR/$dir/$name.png"
}

# Android Mipmap Icons
# mdpi (48x48)
resize_icon 48 "mipmap-mdpi" "ic_launcher"
resize_icon 48 "mipmap-mdpi" "ic_launcher_round"

# hdpi (72x72)
resize_icon 72 "mipmap-hdpi" "ic_launcher"
resize_icon 72 "mipmap-hdpi" "ic_launcher_round"

# xhdpi (96x96)
resize_icon 96 "mipmap-xhdpi" "ic_launcher"
resize_icon 96 "mipmap-xhdpi" "ic_launcher_round"

# xxhdpi (144x144)
resize_icon 144 "mipmap-xxhdpi" "ic_launcher"
resize_icon 144 "mipmap-xxhdpi" "ic_launcher_round"

# xxxhdpi (192x192)
resize_icon 192 "mipmap-xxxhdpi" "ic_launcher"
resize_icon 192 "mipmap-xxxhdpi" "ic_launcher_round"

echo "Launcher icons updated successfully!"
