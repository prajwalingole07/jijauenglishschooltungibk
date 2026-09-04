"use client";
import { useEffect, useState } from "react";

export type StoredPhoto = {
  id: string;
  name: string;
  dataUrl: string;
  teacherUsername: string;
  teacherName: string;
  source: "profile"|"student"|"faculty"|"staff"|"gallery";
  uploadedAt: string;
};

const KEY = "jijau_photo_folder_v1";

function uid(){ return Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4); }

export function getPhotoFolder(): Record<string, StoredPhoto[]>{
  try{
    const raw = localStorage.getItem(KEY);
    if(raw) return JSON.parse(raw);
  }catch{}
  return {};
}

export function saveToPhotoFolder(photo: Omit<StoredPhoto,"id"|"uploadedAt">){
  try{
    const folder = getPhotoFolder();
    const list = folder[photo.teacherUsername] || [];
    list.unshift({ ...photo, id: uid(), uploadedAt: new Date().toISOString() });
    folder[photo.teacherUsername] = list;
    localStorage.setItem(KEY, JSON.stringify(folder));
    window.dispatchEvent(new Event("photoFolderUpdated"));
    window.dispatchEvent(new Event("storage"));
  }catch{}
}

export function getPhotosForTeacher(username:string): StoredPhoto[]{
  const folder = getPhotoFolder();
  return folder[username] || [];
}

export function getAllPhotos(): StoredPhoto[]{
  const folder = getPhotoFolder();
  return Object.values(folder).flat();
}

export function removePhoto(teacherUsername:string, id:string){
  try{
    const folder = getPhotoFolder();
    folder[teacherUsername] = (folder[teacherUsername]||[]).filter(p=> p.id!==id);
    localStorage.setItem(KEY, JSON.stringify(folder));
    window.dispatchEvent(new Event("photoFolderUpdated"));
  }catch{}
}

// Hook for live folder
export function usePhotoFolder(username?:string){
  const [photos,setPhotos]=useState<StoredPhoto[]>(()=> username? getPhotosForTeacher(username) : getAllPhotos());
  useEffect(()=>{
    const update=()=>{
      if(username) setPhotos(getPhotosForTeacher(username));
      else setPhotos(getAllPhotos());
    };
    window.addEventListener("photoFolderUpdated", update);
    window.addEventListener("storage", update);
    return()=> { window.removeEventListener("photoFolderUpdated", update); window.removeEventListener("storage", update); };
  },[username]);
  return photos;
}

// When a teacher uploads any photo via modals, also save to folder
export function autoSaveEntityPhoto(teacherUsername:string, teacherName:string, dataUrl:string, source:StoredPhoto["source"], entityName:string){
  if(!dataUrl || !teacherUsername) return;
  saveToPhotoFolder({ name: entityName, dataUrl, teacherUsername, teacherName, source });
}
