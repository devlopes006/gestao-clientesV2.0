"use client"

import styles from "@/app/login/login.module.css";

export default function GradientBlobs() {
  return (
    <>
      <div className={styles.gradientBlob} />
      <div className={`${styles.gradientBlob} ${styles.delay}`} />
    </>
  );
}
