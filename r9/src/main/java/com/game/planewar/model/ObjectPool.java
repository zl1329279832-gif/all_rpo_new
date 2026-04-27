package com.game.planewar.model;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

/**
 * 对象池 - 用于复用游戏对象，减少内存分配和垃圾回收
 * @param <T> 对象类型，必须继承 GameObject
 */
public class ObjectPool<T extends GameObject> {
    
    private final List<T> pool;
    private final Supplier<T> factory;
    private final int initialSize;
    private int activeCount;
    
    public ObjectPool(Supplier<T> factory, int initialSize) {
        this.factory = factory;
        this.initialSize = initialSize;
        this.pool = new ArrayList<>(initialSize);
        this.activeCount = 0;
        initializePool();
    }
    
    /**
     * 初始化对象池
     */
    private void initializePool() {
        for (int i = 0; i < initialSize; i++) {
            T obj = factory.get();
            obj.setObjectPool(this);
            obj.setActive(false);
            pool.add(obj);
        }
    }
    
    /**
     * 从对象池获取一个对象
     */
    public T acquire() {
        for (T obj : pool) {
            if (!obj.isActive()) {
                obj.setActive(true);
                activeCount++;
                return obj;
            }
        }
        
        T newObj = factory.get();
        newObj.setObjectPool(this);
        newObj.setActive(true);
        pool.add(newObj);
        activeCount++;
        return newObj;
    }
    
    /**
     * 将对象归还到对象池
     */
    public void returnObject(T obj) {
        if (obj != null && obj.isActive()) {
            obj.reset();
            obj.setActive(false);
            activeCount--;
        }
    }
    
    /**
     * 获取所有活跃对象
     */
    public List<T> getActiveObjects() {
        List<T> activeObjects = new ArrayList<>();
        for (T obj : pool) {
            if (obj.isActive()) {
                activeObjects.add(obj);
            }
        }
        return activeObjects;
    }
    
    /**
     * 重置整个对象池
     */
    public void reset() {
        for (T obj : pool) {
            obj.reset();
            obj.setActive(false);
        }
        activeCount = 0;
    }
    
    /**
     * 获取活跃对象数量
     */
    public int getActiveCount() {
        return activeCount;
    }
    
    /**
     * 获取对象池大小
     */
    public int getPoolSize() {
        return pool.size();
    }
}
