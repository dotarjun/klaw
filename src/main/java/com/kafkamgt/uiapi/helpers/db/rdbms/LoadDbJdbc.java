package com.kafkamgt.uiapi.helpers.db.rdbms;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.FileReader;
import java.sql.SQLIntegrityConstraintViolationException;

@Service
@Slf4j
public class LoadDbJdbc {
    private static Logger LOG = LoggerFactory.getLogger(LoadDbJdbc.class);

    private static String CREATE_SQL = "src/main/resources/scripts/base/rdbms/ddl-jdbc.sql";

    private static String INSERT_SQL = "src/main/resources/scripts/base/rdbms/insertdata.sql";

    private static String DROP_SQL = "src/main/resources/scripts/base/rdbms/dropjdbc.sql";

    @Autowired(required=false)
    private JdbcTemplate jdbcTemplate;

    public void createTables(){

        try (BufferedReader in = new BufferedReader(new FileReader(CREATE_SQL))) {
            String tmpLine = "";
            String execQuery = "";
            while((tmpLine=in.readLine())!=null){
                if(tmpLine.toLowerCase().startsWith("create") && tmpLine.toLowerCase().endsWith(";")){
                    execQuery = tmpLine;
                    log.info("Executing query : "+ execQuery);
                    jdbcTemplate.execute(execQuery.trim());
                    execQuery = "";
                }
                else if(tmpLine.toLowerCase().startsWith("create"))
                    execQuery = tmpLine;
                else if(tmpLine.toLowerCase().endsWith(";"))
                {
                    execQuery = execQuery + tmpLine;
                    log.info("Executing query : "+ execQuery);
                    jdbcTemplate.execute(execQuery.trim());
                    execQuery = "";
                }
                else{
                    execQuery = execQuery + tmpLine;
                }

            }
        }
        catch (Exception e){
            LOG.error("Could not create database tables " + e.getMessage());
            System.exit(0);
        }
        LOG.info("Create DB Tables setup done !! ");
    }

    public void dropTables(){

        try (BufferedReader in = new BufferedReader(new FileReader(DROP_SQL))) {
            String tmpLine = "";
            String execQuery = "";
            while((tmpLine=in.readLine())!=null){
                if(tmpLine.toLowerCase().startsWith("drop")
                        && tmpLine.toLowerCase().endsWith(";")){
                    execQuery = tmpLine;
                    log.info("Executing query : "+ execQuery);
                    jdbcTemplate.execute(execQuery.trim());
                    execQuery = "";
                }
                else if(tmpLine.toLowerCase().startsWith("drop"))
                    execQuery = tmpLine;
                else if(tmpLine.toLowerCase().endsWith(";"))
                {
                    execQuery = execQuery + tmpLine;
                    log.info("Executing query : "+ execQuery);
                    jdbcTemplate.execute(execQuery.trim());
                    execQuery = "";
                }
                else{
                    execQuery = execQuery + tmpLine;
                }

            }
        }catch (Exception e){
            LOG.error("Exiting .. could not setup create database tables " + e.getMessage());
            System.exit(0);
        }
        LOG.info("Drop DB Tables setup done !! ");
    }

    public void insertData(){

        try (BufferedReader in = new BufferedReader(new FileReader(INSERT_SQL))) {
            String tmpLine = "";
            String execQuery = "";
            while((tmpLine=in.readLine())!=null){
                if((tmpLine.toLowerCase().startsWith("insert")
                        || tmpLine.toLowerCase().startsWith("update")) && tmpLine.toLowerCase().endsWith(";")){
                    execQuery = tmpLine;
                    log.info("Executing query : "+ execQuery);
                    try {
                        jdbcTemplate.execute(execQuery.trim());
                    }catch (Exception sqlException){
                        if(sqlException instanceof DuplicateKeyException){
                            //do nothing
                        }else throw sqlException;
                    }
                    execQuery = "";
                }
                else if(tmpLine.toLowerCase().startsWith("insert") || tmpLine.toLowerCase().startsWith("update"))
                    execQuery = tmpLine;
                else if(tmpLine.toLowerCase().endsWith(";"))
                {
                    execQuery = execQuery + tmpLine;
                    log.info("Executing query : "+ execQuery);
                    try {
                        jdbcTemplate.execute(execQuery.trim());
                    }catch (Exception sqlException){
                        if(sqlException instanceof SQLIntegrityConstraintViolationException){
                            //do nothing
                        }else throw sqlException;
                    }
                    execQuery = "";
                }
                else{
                    execQuery = execQuery + tmpLine;
                }

            }
        }catch (Exception e){
            LOG.error("Exiting .. could not setup create database tables " + e.getMessage());
            System.exit(0);
        }
        LOG.info("Insert DB Tables setup done !! ");
    }


}
