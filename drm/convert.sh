#!/bin/bash

# Usage: i.e. ./convert.sh CompanyTrailer_eng_576.mp4

# TODO: check that in pssh data is not secret key

rm -rf output* discard.mp4 passlogfile_fp

input=$1
keyint=75
opts="pic-struct:keyint=$keyint:min-keyint=$keyint:no-scenecut:colorprim=bt709:transfer=bt709:colormatrix=bt709:open_gop=0"

ffmpeg -i "$input" -an -vcodec libx264 -profile:v main -pass 1 -g $keyint -x264opts $opts -passlogfile passlogfile_fp discard.mp4
ffmpeg -i "$input" -an -vcodec libx264 -profile:v main -pass 2 -g $keyint -x264opts $opts -vf scale=1024:576 -pix_fmt yuv420p -b:v 384k  -maxrate 384k  -bufsize  384k -passlogfile passlogfile_fp -f mp4 -movflags frag_keyframe+empty_moov output_384.mp4
ffmpeg -i "$input" -an -vcodec libx264 -profile:v main -pass 2 -g $keyint -x264opts $opts -vf scale=1024:576 -pix_fmt yuv420p -b:v 700k  -maxrate 700k  -bufsize  700k -passlogfile passlogfile_fp -f mp4 -movflags frag_keyframe+empty_moov output_700.mp4
ffmpeg -i "$input" -an -vcodec libx264 -profile:v main -pass 2 -g $keyint -x264opts $opts -vf scale=1024:576 -pix_fmt yuv420p -b:v 1300k -maxrate 1300k -bufsize 1300k -passlogfile passlogfile_fp -f mp4 -movflags frag_keyframe+empty_moov output_1300.mp4
ffmpeg -i "$input" -vn -strict -2 -c:a libfdk_aac -b:a 128k -f mp4 -frag_duration 3000000 output_sound.mp4

for filename in output_*.mp4; do
  mp4fragment --fragment-duration 20000 "$filename" "$filename.fragmented"
done

mp4dash \
  --profiles=urn:mpeg:dash:profile:isoff-live:2011,urn:hbbtv:dash:profile:isoff-live:2012 \
  --encryption-key=09e367028f33436ca5dd60ffe6671e70:b42ca3172ee4e69bf51848a59db9cd13 \
  --playready-header=LA_URL:http://playready.directtaps.net/pr/svc/rightsmanager.asmx \
  $(find output_*.mp4.fragmented)
