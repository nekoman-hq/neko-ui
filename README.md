<div align="center">
  <h1>Neko UI</h1>
  <p>A React Native component library</p>
<img alt="Neko-UI Logo" height="512" src="neko-ui-transparent.png" width="768"/>

</div>

[![GitHub release](https://img.shields.io/github/v/release/nekoman-hq/neko-ui?style=flat-square)](https://github.com/nekoman-hq/neko-ui/releases)
[![Last Commit](https://img.shields.io/github/last-commit/nekoman-hq/neko-ui?style=flat-square)](https://github.com/nekoman-hq/neko-ui/commits)
[![Contributors](https://img.shields.io/github/contributors/nekoman-hq/neko-ui?style=flat-square)](https://github.com/nekoman-hq/neko-ui/graphs/contributors)
[![Storybook](https://img.shields.io/badge/storybook-react--native-ff4785?style=flat-square)](#)

## ✨ Overview

**Neko UI** is a reusable **React Native component library** focused on composability, theming, and developer experience.

- Built for **React Native**
- ✅ **NativeWind compatible**
- 🧩 All components follow the **Compound Components Pattern**
- 📦 Designed to be used component-by-component

---

## 📦 Installation

> First NPM release is in progress. 
> Not available yet

```sh
npm install neko-ui 
```

## 🧠 Design Principles

**Compound Components Pattern**

All components in Neko UI are built using the compound components pattern.

This means 
- Complex components are composed of smaller, explicit subcomponents
- State and behavior are shared implicitly
- You get maximum flexibility with a clear API

**Example**
```js

export function Example() {
  return (
    <Widget>
      <WidgetHeader>
        <WidgetText className="!text-foreground">
          Title in Header
        </WidgetText>
        <WidgetChevron className="!color-foreground" />
      </WidgetHeader>

      <WidgetContent>
        <Text className="text-card-foreground">
          Content
        </Text>
      </WidgetContent>
    </Widget>
  );
}
```

🧪 Storybook

Components are designed to work well with Storybook for React Native, using decorators and layout wrappers where needed.